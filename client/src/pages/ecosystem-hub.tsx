import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import {
  ExternalLink, Globe, BookOpen, Brain, Shield, Heart,
  Users, GraduationCap, Briefcase, Home, Phone, AlertTriangle,
  ArrowRight, CheckCircle, Link2, Target, FileText, Activity,
  Sparkles, Scale, Handshake, MapPin, BarChart3, Layers,
  Search, Copy, ChevronDown, ChevronUp, Pill, Cpu, Factory,
  Award, Zap, Building2, ShieldCheck, Stethoscope, MonitorSmartphone,
  ClipboardList
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      { grant: "CDC/ONDCP DFC", relevance: "School engagement is a primary protective factor" },
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
    description: "Nonprofit, neurodiversity-affirming support platform for individuals with autism, ADHD, AuDHD, and other neurodivergent conditions.",
    features: ["AI-Powered Guidance", "IEP/504 Plan Assistance", "Crisis Resources", "Therapy Tools", "Community Support", "Neurodiversity Advocacy"],
    populations: ["Neurodivergent Individuals", "Youth with IEP/504 Plans", "Parents of Neurodivergent Youth", "Educators"],
    thriveUpConnections: [
      { area: "Health & Wellness", description: "Mental health and neurodevelopmental support enhances wellness hub" },
      { area: "Risk Assessment", description: "Neurodevelopmental needs are risk factors for substance use" },
      { area: "Accessibility", description: "Neurodiversity-informed design patterns improve platform accessibility" },
      { area: "Case Management", description: "IEP/504 data integration for holistic participant profiles" },
    ],
    grantAlignment: [
      { grant: "CDC/ONDCP DFC", relevance: "Addresses individual risk factors" },
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
    description: "Incident management platform for mandatory reporters in Texas foster care, schools, healthcare, and childcare. 50-state regulation database, 7-stage incident lifecycle.",
    features: ["50-State Regulation Database", "7-Stage Incident Lifecycle", "Auto-Generated Deadlines", "Tamper-Evident Audit Trails", "Cross-Agency Referencing", "Court-Admissible Records"],
    populations: ["Mandatory Reporters", "Foster Care Workers", "School Personnel", "Healthcare Workers", "Childcare Providers"],
    thriveUpConnections: [
      { area: "Case Management", description: "Incident reports feed into participant case files" },
      { area: "Partner Network", description: "Mandatory reporting infrastructure strengthens community safety" },
      { area: "Early Warning System", description: "Incident patterns trigger Thrive early warning alerts" },
      { area: "Justice Partners", description: "Coordinated reporting between schools, foster care, and justice system" },
    ],
    grantAlignment: [
      { grant: "CDC/ONDCP DFC", relevance: "Community safety infrastructure" },
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
    description: "Free veteran support platform helping service members, veterans, and military families transition from military to civilian life.",
    features: ["Transition Planning Tools", "Benefits Guidance", "Military Skills Translation", "Community Connections", "Military Family Support", "Resource Curation"],
    populations: ["Veterans", "Active Duty Transitioning", "Military Families", "Military Spouses"],
    thriveUpConnections: [
      { area: "Veteran Onboarding", description: "Veteran-specific First 30 Days journey template" },
      { area: "Workforce Pipeline", description: "Military skills translation to civilian career pathways" },
      { area: "Community Partners", description: "VA and veteran service organizations in partner network" },
      { area: "Case Management", description: "Veteran-specific service delivery tracking and outcomes" },
    ],
    grantAlignment: [
      { grant: "CDC/ONDCP DFC", relevance: "Veterans are a key community population" },
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
    description: "Free virtual 211 and Community Health Worker hub connecting individuals to resources. 24/7 with no prerequisites.",
    features: ["24/7 Resource Navigation", "Housing Assistance", "Food Access", "Healthcare Connections", "Mental Health Resources", "Substance Abuse Support", "Domestic Violence Support", "Crisis Support"],
    populations: ["All Community Members", "Individuals in Crisis", "Unhoused Individuals", "Substance Use Recovery", "Domestic Violence Survivors"],
    thriveUpConnections: [
      { area: "Resource Finder", description: "Direct resource matching complements GIS community intelligence" },
      { area: "AI Navigator", description: "Crisis detection routes to LifeBridge 24/7 support" },
      { area: "Social Determinants", description: "Housing, food, healthcare data enriches SDOH profiles" },
      { area: "Community Map", description: "Resource locations feed into community intelligence map" },
      { area: "Prevention", description: "Social service access is a protective factor" },
    ],
    grantAlignment: [
      { grant: "CDC/ONDCP DFC", relevance: "Community-wide prevention infrastructure" },
      { grant: "HHS/HRSA", relevance: "Community health worker infrastructure" },
      { grant: "HUD", relevance: "Housing stability and homelessness prevention" },
      { grant: "SAMHSA", relevance: "Substance abuse resource navigation" },
    ],
    dfcSectors: [8, 9, 10, 12],
  },
  {
    id: "mce",
    name: "Minority Center of Excellence",
    tagline: "Minority Business Lifecycle Ecosystem",
    url: "",
    icon: Factory,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    status: "integrated",
    description: "First comprehensive digital ecosystem for minority-owned businesses across the entire business lifecycle. 656,794 curated records, 14 AI tools, dual-AI proposal review, SAM.gov live integration, 50-state + DC coverage.",
    features: ["6-Stage Business Lifecycle", "656,794 Curated Records", "14 AI Tools (4 Providers)", "Dual-AI Proposal Review", "SAM.gov Live Integration", "Business Health Score", "Certification Wizard (9 Programs)", "Teaming Hub & B2B Networking"],
    populations: ["Minority-Owned Businesses", "VOSB/SDVOSB Firms", "8(a) Businesses", "HUBZone Businesses", "WOSB Firms", "GovCon Professionals"],
    thriveUpConnections: [
      { area: "Workforce Pipeline", description: "Workforce development graduates transition to business formation" },
      { area: "GovCon Intelligence", description: "Shared federal contract discovery with The Incubator" },
      { area: "Veteran Entrepreneurs", description: "M2C Transition veterans guided to VOSB certification" },
      { area: "Community Economic Dev", description: "LifeBridge connects minority businesses to community resources" },
    ],
    grantAlignment: [
      { grant: "SBA SBIR/STTR", relevance: "Small business innovation and technology transfer" },
      { grant: "DOC/MBDA", relevance: "Minority business development agency programs" },
      { grant: "SBA 7(j)", relevance: "Management and technical assistance for MBEs" },
      { grant: "DOT DBE", relevance: "Disadvantaged business enterprise program support" },
    ],
    dfcSectors: [3],
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
  { id: "sba", name: "SBA/DOC MBD", amount: "Varies", deadline: "Varies", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
];

const DOMAIN_ICONS: Record<string, typeof Globe> = {
  "community-workforce": Users,
  "health-equity": Heart,
  "education": GraduationCap,
  "defense-emergency": Shield,
  "veterans": Award,
  "compliance": ShieldCheck,
  "business-intelligence": Building2,
};

const DOMAIN_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  "community-workforce": { text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800" },
  "health-equity": { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800" },
  "education": { text: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/30", border: "border-teal-200 dark:border-teal-800" },
  "defense-emergency": { text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-950/30", border: "border-slate-200 dark:border-slate-800" },
  "veterans": { text: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800" },
  "compliance": { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" },
  "business-intelligence": { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" },
};

const DOMAIN_LABELS: Record<string, string> = {
  "community-workforce": "Community & Workforce",
  "health-equity": "Health Equity",
  "education": "Education",
  "defense-emergency": "Defense & Emergency",
  "veterans": "Veterans",
  "compliance": "Compliance",
  "business-intelligence": "Business Intelligence",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "integrated") return <Badge data-testid="badge-status-integrated" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Fully Integrated</Badge>;
  if (status === "linked") return <Badge data-testid="badge-status-linked" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Linked</Badge>;
  return <Badge data-testid="badge-status-planned" variant="outline">Planned</Badge>;
}

function FullPortfolioTab() {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const { data: portfolioData, isLoading } = useQuery<{
    platforms: any[];
    entityInfo: any;
    proprietaryMethodologies: any[];
    portfolioStats: any;
    naicsCodes: any[];
  }>({
    queryKey: ["/api/ecosystem/portfolio"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  if (!portfolioData) return null;

  const { platforms, portfolioStats } = portfolioData;

  const domainGroups: Record<string, any[]> = {};
  for (const p of platforms) {
    const cat = p.domainCategory || "other";
    if (!domainGroups[cat]) domainGroups[cat] = [];
    domainGroups[cat].push(p);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card data-testid="stat-portfolio-platforms">
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{portfolioStats.platforms}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Platforms</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-portfolio-loc">
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{portfolioStats.linesOfCode}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Lines of Code</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-portfolio-records">
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{portfolioStats.dataRecords}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Data Records</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-portfolio-pages">
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{portfolioStats.functionalPages}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pages</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-portfolio-apis">
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{portfolioStats.apiEndpoints}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">API Endpoints</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-portfolio-tables">
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{portfolioStats.databaseTables}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">DB Tables</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-portfolio-coverage">
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{portfolioStats.stateCoverage}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Coverage</div>
          </CardContent>
        </Card>
      </div>

      {Object.entries(domainGroups).map(([domainKey, domainPlatforms]) => {
        const colors = DOMAIN_COLORS[domainKey] || DOMAIN_COLORS["community-workforce"];
        const DomainIcon = DOMAIN_ICONS[domainKey] || Globe;
        const label = DOMAIN_LABELS[domainKey] || domainKey;

        return (
          <div key={domainKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${colors.bg}`}>
                <DomainIcon className={`h-4 w-4 ${colors.text}`} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{label}</h3>
              <Badge variant="outline" className="text-xs">{domainPlatforms.length} platform{domainPlatforms.length > 1 ? "s" : ""}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {domainPlatforms.map((platform: any) => {
                const isExpanded = expandedPlatform === platform.id;
                return (
                  <Card
                    key={platform.id}
                    className={`cursor-pointer transition-all ${isExpanded ? 'ring-2 ring-violet-500 col-span-full' : ''} ${colors.border}`}
                    onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                    data-testid={`card-portfolio-${platform.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{platform.name}</CardTitle>
                        <div className="flex items-center gap-1.5">
                          {platform.floorPrice !== "Bundled" && platform.floorPrice !== "Contact for quote" && (
                            <Badge variant="outline" className="text-xs">{platform.floorPrice}</Badge>
                          )}
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>
                      <CardDescription className="text-xs">{platform.description.substring(0, 120)}...</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {platform.populations.slice(0, 3).map((pop: string) => (
                          <Badge key={pop} variant="outline" className="text-xs">{pop}</Badge>
                        ))}
                        {platform.populations.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{platform.populations.length - 3}</Badge>
                        )}
                      </div>

                      {platform.subPlatforms && (
                        <div className="flex flex-wrap gap-1">
                          {platform.subPlatforms.map((sub: any) => (
                            <Badge key={sub.name} className="text-xs bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">{sub.name}</Badge>
                          ))}
                        </div>
                      )}

                      {isExpanded && (
                        <div className="mt-3 space-y-4 border-t pt-3 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Capabilities</h4>
                              <ul className="space-y-1">
                                {platform.capabilities.map((cap: string) => (
                                  <li key={cap} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5" /> {cap}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Grant Alignments</h4>
                              <ul className="space-y-1.5">
                                {platform.grantAlignments.map((ga: any) => (
                                  <li key={ga.program} className="text-xs">
                                    <Badge variant="outline" className="text-xs mb-0.5">{ga.role}</Badge>{" "}
                                    <span className="text-gray-600 dark:text-gray-400">{ga.source} - {ga.program}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Interdependencies</h4>
                              <ul className="space-y-1.5">
                                {platform.interdependencies.map((dep: any) => (
                                  <li key={dep.platform} className="text-xs">
                                    <span className="font-medium text-violet-600 dark:text-violet-400">{dep.platform}</span>
                                    <p className="text-gray-500 dark:text-gray-400">{dep.capability}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">NAICS:</span> {platform.naicsCodes.join(", ")}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">Pricing:</span> {platform.pricingModel}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GrantMatcherTab() {
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [queryText, setQueryText] = useState("");
  const { toast } = useToast();

  const { data: fundingStreams } = useQuery<any[]>({
    queryKey: ["/api/ecosystem/funding-streams"],
  });

  const matchMutation = useMutation({
    mutationFn: async (body: { query?: string; fundingStreamId?: string }) => {
      const res = await apiRequest("POST", "/api/ecosystem/grant-match", body);
      return res.json();
    },
  });

  const handleSearch = () => {
    if (!selectedStream && !queryText.trim()) {
      toast({ title: "Please select a funding stream or describe an opportunity", variant: "destructive" });
      return;
    }
    matchMutation.mutate({ query: queryText, fundingStreamId: selectedStream || undefined });
  };

  const copyNarrative = () => {
    if (matchMutation.data?.narrative) {
      navigator.clipboard.writeText(matchMutation.data.narrative);
      toast({ title: "Narrative copied to clipboard" });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-violet-600" />
            Grant Opportunity Matcher
          </CardTitle>
          <CardDescription>Select a funding stream or describe an opportunity to find the best platform combination</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">Funding Stream</label>
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger data-testid="select-funding-stream">
                  <SelectValue placeholder="Select a funding stream..." />
                </SelectTrigger>
                <SelectContent>
                  {(fundingStreams || []).map((stream: any) => (
                    <SelectItem key={stream.id} value={stream.id}>{stream.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">Or Describe an Opportunity</label>
              <Textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="e.g., Veteran workforce transition program with mental health support..."
                className="resize-none"
                data-testid="input-opportunity-description"
              />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={matchMutation.isPending} data-testid="button-match-opportunity">
            <Search className="h-4 w-4 mr-2" />
            {matchMutation.isPending ? "Matching..." : "Find Best Platform Combination"}
          </Button>
        </CardContent>
      </Card>

      {matchMutation.data && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Primary Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {matchMutation.data.primaryPlatforms.map((p: any) => (
                  <Card key={p.id} className="border-green-200 dark:border-green-800" data-testid={`card-primary-${p.id}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Primary</Badge>
                        <span className="font-semibold text-sm">{p.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{p.description.substring(0, 100)}...</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {matchMutation.data.supportingPlatforms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Supporting Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {matchMutation.data.supportingPlatforms.map((p: any) => (
                    <Card key={p.id} className="border-blue-200 dark:border-blue-800" data-testid={`card-supporting-${p.id}`}>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">Supporting</Badge>
                          <span className="font-medium text-sm">{p.name}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  Combined Value Proposition
                </CardTitle>
                <Button variant="outline" size="sm" onClick={copyNarrative} data-testid="button-copy-narrative">
                  <Copy className="h-4 w-4 mr-2" /> Copy to Grant Narrative
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-match-narrative">
                  {matchMutation.data.narrative}
                </p>
              </div>

              {matchMutation.data.interdependencyStory && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Interdependency Story</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{matchMutation.data.interdependencyStory}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">NAICS Codes</h4>
                  <div className="flex flex-wrap gap-1">
                    {matchMutation.data.naicsCodes.map((code: string) => (
                      <Badge key={code} variant="outline" className="text-xs">{code}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Set-Aside Eligibility</h4>
                  <div className="flex flex-wrap gap-1">
                    {matchMutation.data.setAsideEligibility.map((sa: string) => (
                      <Badge key={sa} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{sa}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Estimated Value Range</h4>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-estimated-value">{matchMutation.data.estimatedValueRange}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Competitive Advantages</h4>
                <ul className="space-y-1">
                  {matchMutation.data.competitiveAdvantages.map((adv: string) => (
                    <li key={adv} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" /> {adv}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CompetitiveAdvantagesTab() {
  const { data: portfolioData, isLoading } = useQuery<{
    platforms: any[];
    entityInfo: any;
    proprietaryMethodologies: any[];
    implementationFrameworks: any[];
    portfolioStats: any;
    naicsCodes: any[];
  }>({
    queryKey: ["/api/ecosystem/portfolio"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  if (!portfolioData) return null;

  const { entityInfo, proprietaryMethodologies, implementationFrameworks, portfolioStats, naicsCodes } = portfolioData;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-600" />
            Dual-Entity Structure
          </CardTitle>
          <CardDescription>Flexible contracting through nonprofit and for-profit entities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold">{entityInfo.foundation.name}</h4>
                </div>
                <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mb-2">{entityInfo.foundation.type}</Badge>
                <p className="text-sm text-gray-600 dark:text-gray-400">Eligible for grants, donations, and tax-exempt funding. Ideal for community-facing programs, prevention curricula, and direct service delivery.</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">{entityInfo.llc.name}</h4>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{entityInfo.llc.type}</Badge>
                  {entityInfo.llc.vosbCertified && <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">VOSB Certified</Badge>}
                  <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">SAM.gov Registered</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Eligible for federal contracts, VOSB set-asides, SB/SDB preferences. CAGE Code registered. Ideal for technology contracts and consulting services.</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Leadership</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entityInfo.leadership.map((leader: any) => (
                <div key={leader.name} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                  <Users className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{leader.name}</p>
                    <Badge variant="outline" className="text-xs mb-1">{leader.role}</Badge>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{leader.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Set-Aside Eligibility</h4>
            <div className="flex flex-wrap gap-2">
              {entityInfo.setAsideEligibility.map((sa: string) => (
                <Badge key={sa} className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">{sa}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            Proprietary Methodologies
          </CardTitle>
          <CardDescription>Original intellectual property providing competitive differentiation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {proprietaryMethodologies.map((method: any) => (
            <div key={method.name} className="border rounded-md p-4 dark:border-gray-700">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{method.name}</h4>
                {method.creator && <Badge variant="outline" className="text-xs shrink-0">{method.creator}</Badge>}
              </div>
              {method.fullName && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{method.fullName}</p>}
              {method.description && <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>}
              {method.modes && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {method.modes.map((mode: string) => (
                    <Badge key={mode} variant="outline" className="text-xs">{mode}</Badge>
                  ))}
                </div>
              )}
              {method.innovations && (
                <ul className="mt-2 space-y-1">
                  {method.innovations.map((inn: string) => (
                    <li key={inn} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5" /> {inn}
                    </li>
                  ))}
                </ul>
              )}
              {method.deployedIn && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Deployed in:</span>
                  {method.deployedIn.map((p: string) => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-teal-600" />
            Implementation Science Credibility
          </CardTitle>
          <CardDescription>Operationalized evidence-based frameworks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {implementationFrameworks.map((fw: any) => (
              <Card key={fw.name} className="border-teal-200 dark:border-teal-800" data-testid={`card-framework-${fw.name}`}>
                <CardContent className="pt-3 pb-3">
                  <h4 className="font-bold text-teal-600 dark:text-teal-400">{fw.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{fw.fullName}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{fw.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Portfolio Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Technology Platforms", value: `${portfolioStats.platforms} (${portfolioStats.platformsWithSub} with sub-platforms)` },
              { label: "Production Code", value: portfolioStats.linesOfCode },
              { label: "Curated Data Records", value: portfolioStats.dataRecords },
              { label: "Functional Pages", value: portfolioStats.functionalPages },
              { label: "API Endpoints", value: portfolioStats.apiEndpoints },
              { label: "Database Tables", value: portfolioStats.databaseTables },
              { label: "Coverage", value: portfolioStats.stateCoverage },
              { label: "Combined Ecosystem Value", value: portfolioStats.combinedEcosystemValue },
            ].map((stat) => (
              <div key={stat.label} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
            NAICS Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {naicsCodes.map((naics: any) => (
              <div key={naics.code} className="flex items-start gap-3 p-2 border-b dark:border-gray-700 last:border-b-0">
                <Badge variant="outline" className="shrink-0 font-mono">{naics.code}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{naics.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {naics.platforms.map((p: string) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IP Ownership Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-md p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              The Collaborative Advocate maintains complete intellectual property ownership of all 14 technology platforms, 
              all proprietary methodologies (MAP-GAP, SALP, Three Realities, MG-PATR, ISSS Knowledge Engine), 
              all data architectures, and all curated datasets including MCE's 656,794 curated business records. No third-party licenses, no open-source dependencies 
              for core IP, no shared ownership. This provides absolute freedom in deployment, licensing, white-labeling, 
              and contract execution across any funding stream or commercial engagement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EcosystemHubPage() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const integratedCount = ECOSYSTEM_APPS.filter(a => a.status === "integrated").length;
  const linkedCount = ECOSYSTEM_APPS.filter(a => a.status === "linked").length;
  const totalPopulations = Array.from(new Set(ECOSYSTEM_APPS.flatMap(a => a.populations))).length;
  const allDfcSectors = Array.from(new Set(ECOSYSTEM_APPS.flatMap(a => a.dfcSectors)));
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
            The Collaborative Advocate's 14-platform technology ecosystem — from education and workforce development
            to health equity, defense, veteran services, compliance, business intelligence, and minority business development.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="stat-total-apps">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">14</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Platforms</div>
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
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
            <TabsTrigger value="overview" data-testid="tab-overview">Ecosystem Map</TabsTrigger>
            <TabsTrigger value="portfolio" data-testid="tab-portfolio">Full Portfolio</TabsTrigger>
            <TabsTrigger value="matcher" data-testid="tab-matcher">Grant Matcher</TabsTrigger>
            <TabsTrigger value="advantages" data-testid="tab-advantages">Advantages</TabsTrigger>
            <TabsTrigger value="dfc" data-testid="tab-dfc">DFC Alignment</TabsTrigger>
            <TabsTrigger value="connections" data-testid="tab-connections">Integrations</TabsTrigger>
            <TabsTrigger value="grants" data-testid="tab-grants">Grant Matrix</TabsTrigger>
            <TabsTrigger value="narrative" data-testid="tab-narrative">Narrative</TabsTrigger>
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

          <TabsContent value="portfolio" className="space-y-4">
            <FullPortfolioTab />
          </TabsContent>

          <TabsContent value="matcher" className="space-y-4">
            <GrantMatcherTab />
          </TabsContent>

          <TabsContent value="advantages" className="space-y-4">
            <CompetitiveAdvantagesTab />
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
                    { area: "Addressing Risk Factors for Youth Substance Use", strength: "Comprehensive risk factor assessment across family, peer/social, community, and individual domains. Neurodiversity support addresses mental health risk factors.", apps: ["ThriveUp", "Perfectly Different", "SafeReport"] },
                    { area: "Promoting Protective Factors That Reduce Substance Use Risk", strength: "Protective factor assessment and strengthening. Academic engagement, family bonding, social service access, and veteran community support all build protective factors.", apps: ["ThriveUp", "WholeMind", "LifeBridge", "M2C"] },
                    { area: "Community-Wide Prevention & Education Initiatives", strength: "Full ecosystem covers all community segments. 24/7 crisis support through LifeBridge.", apps: ["All Platforms"] },
                    { area: "Measurable Prevention Outcomes", strength: "Dosage tracking, outcome reporting, pilot data infrastructure, CQI engine for continuous improvement.", apps: ["ThriveUp"] },
                    { area: "100% Cost Match Requirement", strength: "Cost match tracking built into Coalition Dashboard. Partner in-kind contributions, volunteer hours, and facility sharing tracked.", apps: ["ThriveUp"] },
                  ].map((item, i) => (
                    <div key={i} className="border rounded-lg p-4 dark:border-gray-700">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{item.area}</h4>
                        <div className="flex flex-wrap gap-1">
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
                    Our coalition operates through ThriveUp Academy, an AI-powered community enablement platform that serves as the central coordination hub for a network of 14 interconnected service platforms forming The Collaborative Advocate ecosystem. This infrastructure enables real-time cross-sector collaboration, data-driven decision-making, and measurable outcome tracking across all 12 DFC-required community sectors. Our coalition management dashboard tracks sector representation, meeting activity, capacity assessments aligned to SAMHSA's Strategic Prevention Framework, and 100% cost match compliance documentation.
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
                    Our ecosystem serves {totalPopulations}+ distinct population segments including youth, parents, veterans, returning citizens, neurodivergent individuals, and individuals in crisis. LifeBridge provides 24/7 virtual 211 and Community Health Worker services addressing social determinants of health. M2C Transition supports military families. SafeReport ensures mandatory reporting compliance across schools, healthcare, foster care, and childcare settings. The ISSS platform coordinates whole-child student support at the school and district level. Together, these platforms create a community-wide prevention infrastructure that addresses risk factors at every ecological level.
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4" data-testid="narrative-outcomes">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Measurable Outcomes & Continuous Improvement</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Our platform infrastructure tracks prevention outcomes through multiple mechanisms: anonymous youth substance use surveys, risk and protective factor score tracking, prevention curriculum completion and knowledge check performance, dosage tracking for service delivery hours, and a continuous quality improvement (CQI) engine. Our outcome reporting system generates WIOA-compatible, DOJ-aligned, and SAMHSA-formatted reports. The RPLICE platform provides implementation science evaluation via RE-AIM and CFIR frameworks, adding scientific credibility to all measurement.
                  </p>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4" data-testid="narrative-sustainability">
                  <h4 className="font-semibold text-rose-800 dark:text-rose-300 mb-2">Sustainability & Long-Term Impact</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Our coalition's sustainability strategy is built on technology infrastructure that reduces per-participant costs over time, a diversified funding approach spanning 13 federal grant streams, in-kind contributions from 14 platform partners, and a community partner network. The Minority Center of Excellence (MCE) strengthens economic sustainability by connecting minority-owned businesses to federal contracting opportunities, creating a self-reinforcing economic development pipeline. Our cost match tracking system documents all non-federal contributions, and our logic model builder generates theory-of-change documentation. The Collaborative Advocate's dual-entity structure (Foundation + VOSB LLC) ensures flexible contracting and sustainable revenue streams beyond any single grant.
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
