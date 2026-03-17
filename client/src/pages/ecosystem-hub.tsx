import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ExternalLink, Globe, BookOpen, Brain, Shield, Heart,
  Users, GraduationCap, Briefcase, Home, Phone, AlertTriangle,
  ArrowRight, CheckCircle, Link2, Target, FileText, Activity,
  Sparkles, Scale, Handshake, MapPin, BarChart3, Layers
} from "lucide-react";

interface EcosystemApp {
  id: string;
  name: string;
  tagline: string;
  url: string;
  icon: typeof Globe;
  color: string;
  bgColor: string;
  borderColor: string;
  status: "integrated" | "linked" | "planned";
  description: string;
  features: string[];
  populations: string[];
  thriveUpConnections: { area: string; description: string }[];
  grantAlignment: { grant: string; relevance: string }[];
  dfcSectors: number[];
}

const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    id: "thriveup",
    name: "ThriveUp Academy",
    tagline: "AI-Powered Workforce Development & Community Enablement",
    url: "",
    icon: Sparkles,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
    status: "integrated",
    description: "The central platform connecting all ecosystem services. Provides AI-powered workforce development, community intelligence, grant management, case management, and outcome reporting.",
    features: ["AI Curriculum (5 levels)", "50+ Career Pathways", "Grant Discovery Engine", "Community Intelligence Map", "Case Management", "Outcome Reporting", "Coalition Dashboard", "Prevention Curriculum", "Parent Education", "Dosage Tracking"],
    populations: ["Returning Citizens", "Youth", "Veterans", "Single Parents", "Seniors", "Career Changers"],
    thriveUpConnections: [],
    grantAlignment: [
      { grant: "WIOA Title I Youth", relevance: "Core workforce development platform" },
      { grant: "OJJDP Second Chance Act", relevance: "Reentry case management and reporting" },
      { grant: "CDC/ONDCP DFC", relevance: "Prevention curriculum, coalition management, parent education" },
      { grant: "SAMHSA Community Mental Health", relevance: "Health & wellness integration" },
    ],
    dfcSectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  {
    id: "isss",
    name: "ISSS - Integrated Supports for Thriving Youth",
    tagline: "Whole-Child Implementation Infrastructure",
    url: "https://implementationineducatio.com",
    icon: GraduationCap,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    status: "integrated",
    description: "Whole-child implementation infrastructure enabling schools, districts, and regions to implement evidence-based student support at scale through multi-stakeholder coordination and data-driven decision-making.",
    features: ["Multi-Stakeholder Coordination", "Evidence-Based Student Support", "District-Level Analytics", "Data-Driven Decision Making", "Implementation Fidelity Tracking"],
    populations: ["Youth (K-12)", "Educators", "School Districts", "Regional Agencies"],
    thriveUpConnections: [
      { area: "Cross-Platform API", description: "Direct API integration for student data exchange and referrals" },
      { area: "Justice Partners", description: "Referral pipeline from schools to community services" },
      { area: "Thrive Scoring", description: "Student wellbeing data feeds into Thrive domains" },
    ],
    grantAlignment: [
      { grant: "CDC/ONDCP DFC", relevance: "School-based prevention infrastructure and student support coordination" },
      { grant: "WIOA Title I Youth", relevance: "Youth workforce readiness data and school-to-career pipelines" },
      { grant: "OJJDP", relevance: "School-based diversion and early intervention" },
    ],
    dfcSectors: [5, 6, 11],
  },
  {
    id: "sankofa",
    name: "Sankofa Health Network",
    tagline: "Community Health & Wellness Integration",
    url: "",
    icon: Heart,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800",
    status: "integrated",
    description: "Health & wellness gateway providing behavioral health assessments, wellness content, and GIS-based resource recommendations across 5 product lines and 12 health categories.",
    features: ["Behavioral Health Assessments", "Wellness Content Library", "GIS Resource Recommendations", "5 Product Lines", "12 Health Categories", "Proximity-Based Matching"],
    populations: ["All Populations", "Behavioral Health Needs", "Substance Use Recovery"],
    thriveUpConnections: [
      { area: "Health & Wellness Hub", description: "Full gateway integration powering /health-wellness" },
      { area: "Thrive Domain D", description: "Health screening data feeds wellbeing scoring" },
      { area: "GIS Engine", description: "Health resources mapped to community intelligence data" },
    ],
    grantAlignment: [
      { grant: "SAMHSA Community Mental Health", relevance: "Behavioral health assessment and resource matching" },
      { grant: "CDC/ONDCP DFC", relevance: "Substance use screening and health protective factors" },
      { grant: "HHS/HRSA", relevance: "Community health worker infrastructure" },
    ],
    dfcSectors: [10, 12],
  },
  {
    id: "wholemind",
    name: "WholeMind Learning",
    tagline: "Visual-First Pre-K to 12th Grade Education",
    url: "https://life-pals-standalone.replit.app",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    status: "linked",
    description: "Free, visual-first learning platform for Pre-K through 12th grade covering Math, Reading, Science, English, and Social Studies. Features silent accessibility adaptations, AI homework help, and parent-friendly progress tracking.",
    features: ["Pre-K to 12th Grade Curriculum", "Visual-First Learning", "AI Homework Help", "Silent Accessibility", "Parent Progress Tracking", "Math, Reading, Science, English, Social Studies"],
    populations: ["Youth (Pre-K to 12)", "Parents", "Educators"],
    thriveUpConnections: [
      { area: "Prevention Curriculum", description: "Academic engagement as a protective factor against substance use" },
      { area: "Parent Dashboard", description: "Parent progress tracking complements parent prevention education" },
      { area: "Youth Onboarding", description: "Educational assessment data for personalized onboarding journeys" },
      { area: "Dosage Tracking", description: "Learning engagement hours count toward service delivery metrics" },
    ],
    grantAlignment: [
      { grant: "CDC/ONDCP DFC", relevance: "School engagement is a primary protective factor — academic support reduces substance use risk" },
      { grant: "WIOA Title I Youth", relevance: "Educational attainment pathways and GED/diploma support" },
      { grant: "DOE Title I", relevance: "Supplemental education for underserved communities" },
    ],
    dfcSectors: [1, 2, 5],
  },
  {
    id: "perfectly-different",
    name: "Perfectly Different",
    tagline: "Neurodiversity-Affirming Support Platform",
    url: "https://neurodifferentassistant.app",
    icon: Brain,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    status: "linked",
    description: "Nonprofit, neurodiversity-affirming support platform for individuals with autism, ADHD, AuDHD, and other neurodivergent conditions. Provides AI-powered guidance, IEP/504 plan assistance, crisis resources, therapy tools, and community support.",
    features: ["AI-Powered Guidance", "IEP/504 Plan Assistance", "Crisis Resources", "Therapy Tools", "Community Support", "Neurodiversity Advocacy"],
    populations: ["Neurodivergent Individuals", "Youth with IEP/504 Plans", "Parents of Neurodivergent Youth", "Educators"],
    thriveUpConnections: [
      { area: "Health & Wellness", description: "Mental health and neurodevelopmental support enhances wellness hub" },
      { area: "Risk Assessment", description: "Neurodevelopmental needs are risk factors for substance use — targeted support reduces risk" },
      { area: "Accessibility", description: "Neurodiversity-informed design patterns improve platform accessibility" },
      { area: "Case Management", description: "IEP/504 data integration for holistic participant profiles" },
    ],
    grantAlignment: [
      { grant: "CDC/ONDCP DFC", relevance: "Addresses individual risk factors — mental health and neurodevelopmental needs are substance use risk factors" },
      { grant: "SAMHSA", relevance: "Mental health support and crisis intervention" },
      { grant: "IDEA/Special Education", relevance: "IEP/504 compliance and advocacy" },
    ],
    dfcSectors: [6, 10],
  },
  {
    id: "safereport",
    name: "SafeReport",
    tagline: "Mandatory Reporter Incident Management",
    url: "https://incident-response.replit.app",
    icon: Shield,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    status: "linked",
    description: "Incident management platform for mandatory reporters in Texas foster care, schools, healthcare, and childcare. Ensures compliance and that no mandatory reports are missed.",
    features: ["Incident Reporting", "Mandatory Reporter Compliance", "Foster Care Integration", "School Safety", "Healthcare Reporting", "Childcare Oversight"],
    populations: ["Mandatory Reporters", "Foster Care Workers", "School Personnel", "Healthcare Workers", "Childcare Providers"],
    thriveUpConnections: [
      { area: "Case Management", description: "Incident reports feed into participant case files for comprehensive tracking" },
      { area: "Partner Network", description: "Mandatory reporting infrastructure strengthens community safety sector" },
      { area: "Early Warning System", description: "Incident patterns trigger Thrive early warning alerts" },
      { area: "Justice Partners", description: "Coordinated reporting between schools, foster care, and justice system" },
    ],
    grantAlignment: [
      { grant: "CDC/ONDCP DFC", relevance: "Community safety infrastructure — mandatory reporting ensures youth protection" },
      { grant: "OJJDP", relevance: "Child welfare and juvenile justice coordination" },
      { grant: "HHS/ACF", relevance: "Foster care and child welfare compliance" },
    ],
    dfcSectors: [5, 7, 10],
  },
  {
    id: "m2c",
    name: "M2C Transition",
    tagline: "Military-to-Civilian Veteran Support",
    url: "https://vetmissiontransition.com",
    icon: Briefcase,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    status: "linked",
    description: "Free veteran support platform helping service members, veterans, and military families transition from military to civilian life. Offers curated resources, transition planning tools, and community connections.",
    features: ["Transition Planning Tools", "Benefits Guidance", "Community Connections", "VA.gov Complement", "Military Family Support", "Resource Curation"],
    populations: ["Veterans", "Active Duty Transitioning", "Military Families", "Military Spouses"],
    thriveUpConnections: [
      { area: "Veteran Onboarding", description: "Veteran-specific First 30 Days journey template with military transition milestones" },
      { area: "Workforce Pipeline", description: "Military skills translation to civilian career pathways" },
      { area: "Community Partners", description: "VA and veteran service organizations in partner network" },
      { area: "Case Management", description: "Veteran-specific service delivery tracking and outcomes" },
    ],
    grantAlignment: [
      { grant: "CDC/ONDCP DFC", relevance: "Veterans are a key community population — substance use prevention for military families" },
      { grant: "WIOA Title I", relevance: "Veteran workforce transition and employment services" },
      { grant: "DOL VETS", relevance: "Veteran employment and training programs" },
    ],
    dfcSectors: [9],
  },
  {
    id: "lifebridge",
    name: "LifeBridge",
    tagline: "Virtual 211 & Community Health Worker Hub",
    url: "https://lifetransitionsaid.org",
    icon: Phone,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    status: "linked",
    description: "Free virtual 211 and Community Health Worker (CHW) hub connecting individuals to resources for housing, food, healthcare, mental health, substance abuse, domestic violence, child welfare, and senior services. Available 24/7 with no prerequisites.",
    features: ["24/7 Resource Navigation", "Housing Assistance", "Food Access", "Healthcare Connections", "Mental Health Resources", "Substance Abuse Support", "Domestic Violence Support", "Child Welfare", "Senior Services", "Crisis Support"],
    populations: ["All Community Members", "Individuals in Crisis", "Unhoused Individuals", "Substance Use Recovery", "Domestic Violence Survivors"],
    thriveUpConnections: [
      { area: "Resource Finder", description: "Direct resource matching complements GIS community intelligence" },
      { area: "AI Navigator", description: "Crisis detection routes to LifeBridge 24/7 support" },
      { area: "Social Determinants", description: "Housing, food, healthcare data enriches SDOH profiles" },
      { area: "Community Map", description: "Resource locations feed into community intelligence map layers" },
      { area: "Prevention", description: "Social service access is a protective factor reducing substance use risk" },
    ],
    grantAlignment: [
      { grant: "CDC/ONDCP DFC", relevance: "Community-wide prevention infrastructure — addressing social determinants reduces substance use risk factors" },
      { grant: "HHS/HRSA", relevance: "Community health worker infrastructure and resource navigation" },
      { grant: "HUD", relevance: "Housing stability and homelessness prevention" },
      { grant: "SAMHSA", relevance: "Substance abuse resource navigation and crisis support" },
    ],
    dfcSectors: [8, 9, 10, 12],
  },
];

const DFC_SECTORS = [
  { number: 1, name: "Youth (10-18)", icon: Users },
  { number: 2, name: "Parents", icon: Home },
  { number: 3, name: "Business", icon: Briefcase },
  { number: 4, name: "Media", icon: Globe },
  { number: 5, name: "Schools", icon: GraduationCap },
  { number: 6, name: "Youth-Serving Orgs", icon: Heart },
  { number: 7, name: "Law Enforcement", icon: Shield },
  { number: 8, name: "Religious/Fraternal", icon: Handshake },
  { number: 9, name: "Civic/Volunteer", icon: Users },
  { number: 10, name: "Healthcare", icon: Activity },
  { number: 11, name: "Government", icon: Scale },
  { number: 12, name: "Substance Abuse Orgs", icon: AlertTriangle },
];

const GRANT_STREAMS = [
  { id: "dfc", name: "CDC/ONDCP DFC", amount: "$125K/yr x 5yr", deadline: "April 14, 2026", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { id: "wioa", name: "WIOA Title I Youth", amount: "Varies", deadline: "Ongoing", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { id: "ojjdp", name: "OJJDP Second Chance", amount: "$750K", deadline: "Varies", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { id: "samhsa", name: "SAMHSA Mental Health", amount: "$1M+", deadline: "Varies", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { id: "hhs", name: "HHS/HRSA", amount: "Varies", deadline: "Varies", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "integrated") return <Badge data-testid="badge-status-integrated" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Fully Integrated</Badge>;
  if (status === "linked") return <Badge data-testid="badge-status-linked" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Linked</Badge>;
  return <Badge data-testid="badge-status-planned" variant="outline">Planned</Badge>;
}

export default function EcosystemHubPage() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const integratedCount = ECOSYSTEM_APPS.filter(a => a.status === "integrated").length;
  const linkedCount = ECOSYSTEM_APPS.filter(a => a.status === "linked").length;
  const totalPopulations = [...new Set(ECOSYSTEM_APPS.flatMap(a => a.populations))].length;
  const allDfcSectors = [...new Set(ECOSYSTEM_APPS.flatMap(a => a.dfcSectors))];
  const dfcCoverage = Math.round((allDfcSectors.length / 12) * 100);

  const selectedAppData = ECOSYSTEM_APPS.find(a => a.id === selectedApp);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30 dark:from-gray-950 dark:to-violet-950/10 p-6" data-testid="page-ecosystem-hub">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="heading-ecosystem">
            Ecosystem Integration Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            A connected network of platforms serving communities holistically — from education and workforce development
            to health, safety, veteran services, and social determinants of health.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="stat-total-apps">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">{ECOSYSTEM_APPS.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Connected Platforms</div>
            </CardContent>
          </Card>
          <Card data-testid="stat-integrated">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{integratedCount}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Fully Integrated</div>
            </CardContent>
          </Card>
          <Card data-testid="stat-populations">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalPopulations}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Populations Served</div>
            </CardContent>
          </Card>
          <Card data-testid="stat-dfc-coverage">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{dfcCoverage}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">DFC Sector Coverage</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Ecosystem Map</TabsTrigger>
            <TabsTrigger value="dfc" data-testid="tab-dfc">DFC Grant Alignment</TabsTrigger>
            <TabsTrigger value="connections" data-testid="tab-connections">Integration Points</TabsTrigger>
            <TabsTrigger value="grants" data-testid="tab-grants">Grant Matrix</TabsTrigger>
            <TabsTrigger value="narrative" data-testid="tab-narrative">Grant Narrative</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ECOSYSTEM_APPS.map((app) => {
                const IconComponent = app.icon;
                return (
                  <Card
                    key={app.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedApp === app.id ? 'ring-2 ring-violet-500' : ''} ${app.borderColor}`}
                    onClick={() => setSelectedApp(selectedApp === app.id ? null : app.id)}
                    data-testid={`card-app-${app.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${app.bgColor}`}>
                          <IconComponent className={`h-6 w-6 ${app.color}`} />
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <CardDescription>{app.tagline}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{app.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {app.populations.slice(0, 3).map((pop) => (
                          <Badge key={pop} variant="outline" className="text-xs">{pop}</Badge>
                        ))}
                        {app.populations.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{app.populations.length - 3}</Badge>
                        )}
                      </div>
                      {app.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => { e.stopPropagation(); window.open(app.url, '_blank'); }}
                          data-testid={`button-visit-${app.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" /> Visit Platform
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedAppData && (
              <Card className="mt-4" data-testid="card-app-detail">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${selectedAppData.bgColor}`}>
                      <selectedAppData.icon className={`h-8 w-8 ${selectedAppData.color}`} />
                    </div>
                    <div>
                      <CardTitle>{selectedAppData.name}</CardTitle>
                      <CardDescription>{selectedAppData.tagline}</CardDescription>
                    </div>
                    <div className="ml-auto"><StatusBadge status={selectedAppData.status} /></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-600 dark:text-gray-400">{selectedAppData.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Key Features</h4>
                      <ul className="space-y-1">
                        {selectedAppData.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">ThriveUp Connections</h4>
                      {selectedAppData.thriveUpConnections.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedAppData.thriveUpConnections.map((c) => (
                            <li key={c.area} className="text-sm">
                              <span className="font-medium text-violet-600 dark:text-violet-400">{c.area}</span>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">{c.description}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">This is the central hub — all apps connect here.</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Grant Alignment</h4>
                      <ul className="space-y-2">
                        {selectedAppData.grantAlignment.map((g) => (
                          <li key={g.grant} className="text-sm">
                            <Badge variant="outline" className="text-xs mb-1">{g.grant}</Badge>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">{g.relevance}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">DFC Sectors Served</h4>
                    <div className="flex flex-wrap gap-2">
                      {DFC_SECTORS.map((sector) => {
                        const isServed = selectedAppData.dfcSectors.includes(sector.number);
                        return (
                          <Badge
                            key={sector.number}
                            className={isServed
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                            }
                          >
                            {sector.number}. {sector.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dfc" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  CDC/ONDCP Drug-Free Communities (DFC) Sector Coverage
                </CardTitle>
                <CardDescription>
                  DFC grants require coalitions with representation from 12 community sectors.
                  Our ecosystem covers {allDfcSectors.length} of 12 sectors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Sector Coverage</span>
                    <span className="text-sm font-bold text-green-600">{dfcCoverage}%</span>
                  </div>
                  <Progress value={dfcCoverage} className="h-3" data-testid="progress-dfc-coverage" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {DFC_SECTORS.map((sector) => {
                    const servingApps = ECOSYSTEM_APPS.filter(a => a.dfcSectors.includes(sector.number));
                    const isCovered = servingApps.length > 0;
                    const SectorIcon = sector.icon;
                    return (
                      <Card key={sector.number} className={`${isCovered ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800 opacity-60'}`} data-testid={`card-dfc-sector-${sector.number}`}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isCovered ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                              <SectorIcon className={`h-5 w-5 ${isCovered ? 'text-green-600 dark:text-green-400' : 'text-red-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{sector.number}. {sector.name}</span>
                                {isCovered ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {servingApps.map(app => (
                                  <Badge key={app.id} variant="outline" className="text-xs">{app.name.split(' ')[0]}</Badge>
                                ))}
                                {!isCovered && <span className="text-xs text-red-400">Gap — needs coalition partner</span>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DFC Application Strengths</CardTitle>
                <CardDescription>How our ecosystem addresses each DFC focus area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { area: "Establishing & Strengthening Community Coalitions", strength: "Coalition Dashboard with 12-sector tracker, meeting management, capacity assessment, and SPF-aligned action plans. Multi-app ecosystem demonstrates genuine cross-sector collaboration.", apps: ["ThriveUp", "ISSS", "LifeBridge"] },
                    { area: "Preventing Youth Substance Use Through Community Strategies", strength: "24-module prevention curriculum across 8 substance topics with 3 age tiers. Evidence-based content aligned to SAMHSA Strategic Prevention Framework.", apps: ["ThriveUp", "WholeMind", "Perfectly Different"] },
                    { area: "Addressing Risk Factors for Youth Substance Use", strength: "Comprehensive risk factor assessment across family, peer/social, community, and individual domains. Neurodiversity support addresses mental health risk factors. Mandatory reporting ensures child safety.", apps: ["ThriveUp", "Perfectly Different", "SafeReport"] },
                    { area: "Promoting Protective Factors That Reduce Substance Use Risk", strength: "Protective factor assessment and strengthening. Academic engagement (WholeMind), family bonding (Parent Education), social service access (LifeBridge), and veteran community support (M2C) all build protective factors.", apps: ["ThriveUp", "WholeMind", "LifeBridge", "M2C"] },
                    { area: "Community-Wide Prevention & Education Initiatives", strength: "Full ecosystem covers all community segments — youth education, parent engagement, healthcare, veteran services, social determinants, school infrastructure, and mandatory reporting. 24/7 crisis support through LifeBridge.", apps: ["All Platforms"] },
                    { area: "Measurable Prevention Outcomes", strength: "Dosage tracking, outcome reporting, pilot data infrastructure, CQI engine for continuous improvement. Risk/protective factor score tracking over time. Anonymous youth substance use surveys for baseline and outcome measurement.", apps: ["ThriveUp"] },
                    { area: "100% Cost Match Requirement", strength: "Cost match tracking built into Coalition Dashboard. Partner in-kind contributions, volunteer hours, and facility sharing tracked through Community Partner Network.", apps: ["ThriveUp"] },
                  ].map((item, i) => (
                    <div key={i} className="border rounded-lg p-4 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{item.area}</h4>
                        <div className="flex gap-1">
                          {item.apps.map(app => (
                            <Badge key={app} variant="outline" className="text-xs">{app}</Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-violet-600" />
                  Integration Architecture
                </CardTitle>
                <CardDescription>How each platform connects to ThriveUp Academy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {ECOSYSTEM_APPS.filter(a => a.id !== "thriveup").map((app) => {
                    const IconComponent = app.icon;
                    return (
                      <div key={app.id} className="border rounded-lg p-4 dark:border-gray-700" data-testid={`integration-${app.id}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${app.bgColor}`}>
                            <IconComponent className={`h-5 w-5 ${app.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{app.name}</h4>
                              <StatusBadge status={app.status} />
                            </div>
                          </div>
                          {app.url && (
                            <Button variant="ghost" size="sm" onClick={() => window.open(app.url, '_blank')} data-testid={`button-open-${app.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {app.thriveUpConnections.map((conn) => (
                            <div key={conn.area} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                              <ArrowRight className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">{conn.area}</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{conn.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Grant Alignment Matrix
                </CardTitle>
                <CardDescription>How each ecosystem platform supports different grant streams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-grant-matrix">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-3 px-2 font-semibold">Platform</th>
                        {GRANT_STREAMS.map(g => (
                          <th key={g.id} className="text-center py-3 px-2">
                            <Badge className={`${g.color} text-xs`}>{g.name}</Badge>
                            <div className="text-xs text-gray-400 mt-1">{g.amount}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ECOSYSTEM_APPS.map(app => (
                        <tr key={app.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <app.icon className={`h-4 w-4 ${app.color}`} />
                              <span className="font-medium">{app.name.split(' - ')[0]}</span>
                            </div>
                          </td>
                          {GRANT_STREAMS.map(grant => {
                            const alignment = app.grantAlignment.find(a =>
                              a.grant.toLowerCase().includes(grant.id === "dfc" ? "dfc" : grant.id)
                            );
                            return (
                              <td key={grant.id} className="text-center py-3 px-2">
                                {alignment ? (
                                  <div className="group relative">
                                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                    <div className="hidden group-hover:block absolute z-10 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg p-2 w-48 -left-16 top-6">
                                      <p className="text-xs text-gray-600 dark:text-gray-300">{alignment.relevance}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="narrative" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  DFC Grant Narrative — Ecosystem Strength Statement
                </CardTitle>
                <CardDescription>Ready-to-use language for your DFC application describing the ecosystem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" data-testid="narrative-coalition-infrastructure">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Coalition Infrastructure</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Our coalition operates through ThriveUp Academy, an AI-powered community enablement platform that serves as the central coordination hub for a network of {ECOSYSTEM_APPS.length} interconnected service platforms. This infrastructure enables real-time cross-sector collaboration, data-driven decision-making, and measurable outcome tracking across all 12 DFC-required community sectors. Our coalition management dashboard tracks sector representation, meeting activity, capacity assessments aligned to SAMHSA's Strategic Prevention Framework, and 100% cost match compliance documentation.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4" data-testid="narrative-prevention-strategy">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Evidence-Based Prevention Strategy</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Our prevention strategy encompasses a 24-module youth substance prevention curriculum covering 8 substance topics across 3 age tiers (10-14, 15-18, 19-24), complemented by 13 parent prevention education modules addressing substance awareness and family strengthening. We assess both risk factors (family, peer/social, community, individual domains) and protective factors (family bonding, school engagement, prosocial involvement, refusal skills, coping strategies, adult mentorship) using validated instruments. Our educational ecosystem includes WholeMind Learning, a visual-first K-12 platform that strengthens the critical protective factor of academic engagement, and Perfectly Different, a neurodiversity-affirming platform that addresses mental health risk factors among neurodivergent youth.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4" data-testid="narrative-community-reach">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Community-Wide Reach & Impact</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Our ecosystem serves {totalPopulations}+ distinct population segments including youth, parents, veterans, returning citizens, neurodivergent individuals, and individuals in crisis. LifeBridge provides 24/7 virtual 211 and Community Health Worker services addressing social determinants of health — housing, food, healthcare, mental health, and substance abuse resources. M2C Transition supports military families, a population with elevated substance use risk factors. SafeReport ensures mandatory reporting compliance across schools, healthcare, foster care, and childcare settings. The Integrated Supports for Thriving Youth (ISSS) platform coordinates whole-child student support at the school and district level. Together, these platforms create a community-wide prevention infrastructure that addresses risk factors at every ecological level — individual, family, school, peer group, and community.
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4" data-testid="narrative-outcomes">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Measurable Outcomes & Continuous Improvement</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Our platform infrastructure tracks prevention outcomes through multiple mechanisms: anonymous youth substance use surveys for baseline and follow-up measurement, risk and protective factor score tracking over time, prevention curriculum completion and knowledge check performance, dosage tracking for service delivery hours, and a continuous quality improvement (CQI) engine that cycles through Observe-Prioritize-Act-Check-Standardize phases. Our outcome reporting system generates WIOA-compatible, DOJ-aligned, and SAMHSA-formatted reports. The pilot data infrastructure supports cohort-based evaluation with pre/post comparison capability.
                  </p>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4" data-testid="narrative-sustainability">
                  <h4 className="font-semibold text-rose-800 dark:text-rose-300 mb-2">Sustainability & Long-Term Impact</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Our coalition's sustainability strategy is built on technology infrastructure that reduces per-participant costs over time, a diversified funding approach spanning multiple federal grant streams (WIOA, OJJDP, SAMHSA, HHS/HRSA, CDC/ONDCP), in-kind contributions from {ECOSYSTEM_APPS.length} platform partners, and a community partner network of organizations that provide volunteer hours, facilities, and direct services. Our cost match tracking system documents all non-federal contributions for grant compliance, and our logic model builder generates theory-of-change documentation showing how inputs translate to long-term community outcomes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
