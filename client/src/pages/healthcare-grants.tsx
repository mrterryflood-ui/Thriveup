import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  Heart, Brain, Shield, Search, ExternalLink, CheckCircle2,
  Globe, Users, Stethoscope, Target, Building2, Calendar,
  ArrowRight, Star, Sparkles, Activity, BookOpen, Baby,
  Scale, TrendingUp, MapPin, FileText, Layers, AlertTriangle,
} from "lucide-react";

interface GrantOpportunity {
  id: string;
  name: string;
  funder: string;
  category: string;
  amount: string;
  deadline: string;
  description: string;
  url: string;
  focus: string[];
  platformAlignment: string[];
  alignmentScore: number;
  implementationScience: boolean;
  equityFocus: boolean;
  status: "open" | "upcoming" | "rolling";
}

const GRANT_OPPORTUNITIES: GrantOpportunity[] = [
  {
    id: "samhsa-ccbhc",
    name: "SAMHSA Community Mental Health Centers",
    funder: "SAMHSA",
    category: "mental-health",
    amount: "$1M–$4M per year",
    deadline: "Rolling — Check grants.gov",
    description: "Certified Community Behavioral Health Clinics expansion. Funds integrated mental health and substance use services with 24/7 crisis response, care coordination, and evidence-based practices.",
    url: "https://www.samhsa.gov/grants",
    focus: ["Mental health services", "Substance use treatment", "Crisis intervention", "Care coordination"],
    platformAlignment: ["SafeCogniCare", "Whole-Person Health", "ISSS", "Sankofa Health"],
    alignmentScore: 92,
    implementationScience: true,
    equityFocus: true,
    status: "rolling",
  },
  {
    id: "hrsa-chw",
    name: "HRSA Community Health Worker Training",
    funder: "HRSA",
    category: "community-health",
    amount: "$500K–$1.5M per year",
    deadline: "Varies by cycle",
    description: "Training and deploying community health workers in underserved communities. Focuses on health promotion, care navigation, chronic disease prevention, and social determinants of health.",
    url: "https://www.hrsa.gov/grants",
    focus: ["CHW workforce development", "Health navigation", "Chronic disease prevention", "SDOH interventions"],
    platformAlignment: ["CHW Dashboard", "Sankofa Health", "ThriveUp Academy", "Whole-Person Health"],
    alignmentScore: 95,
    implementationScience: true,
    equityFocus: true,
    status: "rolling",
  },
  {
    id: "hrsa-maternal",
    name: "HRSA Maternal & Child Health",
    funder: "HRSA",
    category: "womens-health",
    amount: "$500K–$2M per year",
    deadline: "Annual cycle — Check HRSA.gov",
    description: "Improving maternal and child health outcomes, especially in underserved populations. Addresses maternal mortality, perinatal mental health, infant health disparities, and postpartum support.",
    url: "https://mchb.hrsa.gov/funding",
    focus: ["Maternal mortality reduction", "Perinatal mental health", "Infant health", "Postpartum support"],
    platformAlignment: ["Black Maternal Health Network", "Holistic Black Feminine Health Hub", "Sankofa Health", "Whole-Person Health"],
    alignmentScore: 97,
    implementationScience: true,
    equityFocus: true,
    status: "upcoming",
  },
  {
    id: "cdc-health-equity",
    name: "CDC Racial & Ethnic Health Disparities",
    funder: "CDC",
    category: "health-equity",
    amount: "$250K–$1M per year",
    deadline: "Annual — Check grants.gov",
    description: "Reducing health disparities in racial and ethnic minority populations through community-based interventions, data-driven strategies, and culturally responsive care models.",
    url: "https://www.cdc.gov/funding",
    focus: ["Health disparities reduction", "Culturally responsive care", "Community-based interventions", "Data-driven health equity"],
    platformAlignment: ["Sankofa Health", "Black Men's Health Hub", "Black Maternal Health Network", "Whole-Person Health"],
    alignmentScore: 94,
    implementationScience: true,
    equityFocus: true,
    status: "rolling",
  },
  {
    id: "nimhd-research",
    name: "NIMHD Health Disparities Research",
    funder: "NIH / NIMHD",
    category: "research",
    amount: "$250K–$500K per year",
    deadline: "Standard NIH cycles",
    description: "Research grants focused on understanding and eliminating health disparities. Supports community-engaged research, implementation science studies, and intervention development.",
    url: "https://www.nimhd.nih.gov/funding/",
    focus: ["Health disparities research", "Community-engaged research", "Implementation science", "Intervention development"],
    platformAlignment: ["Better Science Lab / RPLICE", "Sankofa Health", "Whole-Person Health", "SafeCogniCare"],
    alignmentScore: 88,
    implementationScience: true,
    equityFocus: true,
    status: "rolling",
  },
  {
    id: "owh-womens-health",
    name: "Office on Women's Health Programs",
    funder: "HHS / OWH",
    category: "womens-health",
    amount: "$200K–$800K per year",
    deadline: "Annual — Check womenshealth.gov",
    description: "Programs advancing women's health through evidence-based interventions, community health education, preventive care access, and addressing gender-specific health disparities.",
    url: "https://www.womenshealth.gov/about-us/funding-opportunities",
    focus: ["Women's preventive health", "Gender health disparities", "Community health education", "Reproductive health access"],
    platformAlignment: ["Holistic Black Feminine Health Hub", "Black Maternal Health Network", "Sankofa Health", "Whole-Person Health"],
    alignmentScore: 91,
    implementationScience: false,
    equityFocus: true,
    status: "upcoming",
  },
  {
    id: "samhsa-suicide-prevention",
    name: "SAMHSA Suicide Prevention Programs",
    funder: "SAMHSA",
    category: "mental-health",
    amount: "$500K–$2M per year",
    deadline: "Annual — Check grants.gov",
    description: "Community-based suicide prevention, mental health screening, crisis intervention, and postvention support. Emphasis on high-risk populations including veterans, youth, and minority communities.",
    url: "https://www.samhsa.gov/grants",
    focus: ["Suicide prevention", "Mental health screening", "Crisis intervention", "High-risk population support"],
    platformAlignment: ["SafeReport", "SafeCogniCare", "ISSS", "Whole-Person Health"],
    alignmentScore: 89,
    implementationScience: true,
    equityFocus: true,
    status: "rolling",
  },
  {
    id: "hrsa-behavioral-health",
    name: "HRSA Behavioral Health Workforce",
    funder: "HRSA",
    category: "mental-health",
    amount: "$500K–$1.5M per year",
    deadline: "Annual — Check HRSA.gov",
    description: "Expanding the behavioral health workforce in underserved areas. Training mental health counselors, peer support specialists, and clinical supervisors in high-need communities.",
    url: "https://bhw.hrsa.gov/funding",
    focus: ["Behavioral health workforce", "Peer support training", "Clinical supervision", "Underserved area access"],
    platformAlignment: ["ThriveUp Academy", "SafeCogniCare", "CHW Dashboard", "Mission Transition"],
    alignmentScore: 90,
    implementationScience: false,
    equityFocus: true,
    status: "upcoming",
  },
  {
    id: "cdc-chronic-disease",
    name: "CDC Chronic Disease Prevention",
    funder: "CDC",
    category: "community-health",
    amount: "$300K–$1M per year",
    deadline: "Annual — Check grants.gov",
    description: "Preventing and managing chronic diseases (diabetes, heart disease, hypertension) through community-based programs, health education, and addressing social determinants of health.",
    url: "https://www.cdc.gov/chronic-disease/php/funding-and-partners/",
    focus: ["Diabetes prevention", "Heart disease reduction", "Community health promotion", "SDOH interventions"],
    platformAlignment: ["Sankofa Health", "Black Men's Health Hub", "Whole-Person Health", "CHW Dashboard"],
    alignmentScore: 87,
    implementationScience: true,
    equityFocus: true,
    status: "rolling",
  },
  {
    id: "st-davids-health",
    name: "St. David's Foundation — Health Equity",
    funder: "St. David's Foundation",
    category: "health-equity",
    amount: "Up to $1M (collaborative)",
    deadline: "Application opens March 30, 2026",
    description: "Central Texas health equity grants focused on community-driven change, healthcare workforce development, culturally responsive mental health, and maternal health. Strong emphasis on community voice and equity.",
    url: "https://stdavidsfoundation.org/grants/",
    focus: ["Central Texas health equity", "Community-driven change", "Healthcare workforce", "Maternal health"],
    platformAlignment: ["Sankofa Health", "Black Maternal Health Network", "ThriveUp Academy", "LifeBridge"],
    alignmentScore: 96,
    implementationScience: true,
    equityFocus: true,
    status: "upcoming",
  },
  {
    id: "hogg-mental-health",
    name: "Hogg Foundation for Mental Health",
    funder: "Hogg Foundation",
    category: "mental-health",
    amount: "$50K–$500K",
    deadline: "Rolling / RFP-based",
    description: "Texas-based foundation focused on mental health transformation. Funds community-based mental health programs, peer support services, integrated care, and policy advocacy.",
    url: "https://hogg.utexas.edu/grants-scholarships",
    focus: ["Community mental health", "Peer support", "Integrated care", "Mental health equity"],
    platformAlignment: ["SafeCogniCare", "ISSS", "Whole-Person Health", "ThriveUp Academy"],
    alignmentScore: 93,
    implementationScience: false,
    equityFocus: true,
    status: "rolling",
  },
  {
    id: "episcopal-health",
    name: "Episcopal Health Foundation",
    funder: "Episcopal Health Foundation",
    category: "community-health",
    amount: "$100K–$500K",
    deadline: "Annual RFP cycle",
    description: "Texas health grants focused on building healthier communities through access, equity, and systems change. Strong interest in community health workers, faith-based health, and rural health infrastructure.",
    url: "https://www.episcopalhealth.org/",
    focus: ["Community health access", "Health systems change", "CHW programs", "Rural health"],
    platformAlignment: ["CHW Dashboard", "Sankofa Health", "Whole-Person Health", "LifeBridge"],
    alignmentScore: 85,
    implementationScience: false,
    equityFocus: true,
    status: "upcoming",
  },
  {
    id: "methodist-healthcare",
    name: "Methodist Healthcare Ministries",
    funder: "Methodist Healthcare Ministries",
    category: "community-health",
    amount: "$50K–$300K",
    deadline: "Annual RFP",
    description: "South/Central Texas health programs focused on low-income and uninsured populations. Funds primary care access, mental health services, health education, and chronic disease management.",
    url: "https://www.mhm.org/",
    focus: ["Primary care access", "Mental health services", "Health education", "Low-income populations"],
    platformAlignment: ["Sankofa Health", "Whole-Person Health", "CHW Dashboard", "SafeCogniCare"],
    alignmentScore: 82,
    implementationScience: false,
    equityFocus: true,
    status: "rolling",
  },
  {
    id: "pcori-engagement",
    name: "PCORI Patient-Centered Outcomes Research",
    funder: "PCORI",
    category: "research",
    amount: "$250K–$2M",
    deadline: "Multiple cycles per year",
    description: "Patient-centered comparative effectiveness research. Funds studies that engage patients and communities in research design, with emphasis on reducing health disparities and improving care delivery.",
    url: "https://www.pcori.org/funding-opportunities",
    focus: ["Patient-centered research", "Comparative effectiveness", "Community engagement", "Care delivery improvement"],
    platformAlignment: ["Better Science Lab / RPLICE", "Whole-Person Health", "Sankofa Health", "SafeCogniCare"],
    alignmentScore: 86,
    implementationScience: true,
    equityFocus: true,
    status: "rolling",
  },
  {
    id: "rwjf-health-equity",
    name: "Robert Wood Johnson Foundation — Health Equity",
    funder: "RWJF",
    category: "health-equity",
    amount: "$100K–$500K",
    deadline: "Rolling / CFP-based",
    description: "Building a culture of health where everyone has a fair and just opportunity to be as healthy as possible. Funds systems change, community power building, and health equity research.",
    url: "https://www.rwjf.org/en/grants.html",
    focus: ["Culture of health", "Systems change", "Community power building", "Health equity research"],
    platformAlignment: ["Sankofa Health", "Whole-Person Health", "Better Science Lab / RPLICE", "ThriveUp Academy"],
    alignmentScore: 84,
    implementationScience: true,
    equityFocus: true,
    status: "rolling",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Healthcare", icon: Heart, color: "text-red-600" },
  { id: "mental-health", label: "Mental Health", icon: Brain, color: "text-purple-600" },
  { id: "womens-health", label: "Women's Health", icon: Baby, color: "text-pink-600" },
  { id: "community-health", label: "Community Health", icon: Stethoscope, color: "text-blue-600" },
  { id: "health-equity", label: "Health Equity", icon: Scale, color: "text-emerald-600" },
  { id: "research", label: "Research & Implementation Science", icon: BookOpen, color: "text-amber-600" },
];

const PLATFORM_STRENGTHS = [
  { platform: "Sankofa Health Network", capabilities: "Health equity dashboards, culturally responsive care models, community health data", icon: Heart },
  { platform: "Black Maternal Health Network", capabilities: "Maternal mortality prevention, perinatal support, birth equity programs", icon: Baby },
  { platform: "Black Men's Health Hub", capabilities: "Men's health screening, chronic disease prevention, peer support", icon: Shield },
  { platform: "Holistic Black Feminine Health Hub", capabilities: "Women's wellness, reproductive health, holistic care coordination", icon: Sparkles },
  { platform: "Whole-Person Health Ecosystem", capabilities: "Integrated health management, SDOH tracking, care navigation", icon: Globe },
  { platform: "SafeCogniCare", capabilities: "Cognitive health screening, mental health assessment, neurodivergent support", icon: Brain },
  { platform: "CHW Dashboard", capabilities: "Community health worker management, training tracking, outreach documentation", icon: Stethoscope },
  { platform: "Better Science Lab / RPLICE", capabilities: "Implementation science (CFIR, RE-AIM), fidelity tracking, outcome evaluation", icon: Target },
  { platform: "ISSS — Integrated Supports", capabilities: "Youth mental health, risk factor screening, protective factor building", icon: Shield },
  { platform: "SafeReport", capabilities: "Crisis reporting, safety monitoring, intervention tracking", icon: AlertTriangle },
];

function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 80) return "text-blue-600 dark:text-blue-400";
  if (score >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-gray-600 dark:text-gray-400";
}

function getScoreBg(score: number): string {
  if (score >= 90) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (score >= 80) return "bg-blue-100 dark:bg-blue-900/30";
  if (score >= 70) return "bg-amber-100 dark:bg-amber-900/30";
  return "bg-gray-100 dark:bg-gray-900/30";
}

export default function HealthcareGrantsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEquityOnly, setShowEquityOnly] = useState(false);
  const [showImplSciOnly, setShowImplSciOnly] = useState(false);

  const filteredGrants = GRANT_OPPORTUNITIES
    .filter(g => activeCategory === "all" || g.category === activeCategory)
    .filter(g => !showEquityOnly || g.equityFocus)
    .filter(g => !showImplSciOnly || g.implementationScience)
    .filter(g => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return g.name.toLowerCase().includes(term) ||
        g.funder.toLowerCase().includes(term) ||
        g.description.toLowerCase().includes(term) ||
        g.focus.some(f => f.toLowerCase().includes(term)) ||
        g.platformAlignment.some(p => p.toLowerCase().includes(term));
    })
    .sort((a, b) => b.alignmentScore - a.alignmentScore);

  const topAligned = GRANT_OPPORTUNITIES.slice().sort((a, b) => b.alignmentScore - a.alignmentScore).slice(0, 5);

  const categoryStats = CATEGORIES.filter(c => c.id !== "all").map(c => ({
    ...c,
    count: GRANT_OPPORTUNITIES.filter(g => g.category === c.id).length,
    avgScore: Math.round(GRANT_OPPORTUNITIES.filter(g => g.category === c.id).reduce((s, g) => s + g.alignmentScore, 0) / Math.max(1, GRANT_OPPORTUNITIES.filter(g => g.category === c.id).length)),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" data-testid="page-healthcare-grants">
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-900 via-red-950 to-pink-950 text-white py-16 px-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Badge className="mb-4 bg-rose-500/20 text-rose-200 border-rose-400/30" data-testid="badge-healthcare-header">
            <Heart className="h-3 w-3 mr-1" />
            Healthcare Equity &middot; Implementation Science &middot; Research
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-healthcare-title">
            Healthcare Grant Research Hub
          </h1>
          <p className="text-xl text-rose-200 max-w-3xl mb-3">
            Federal and foundation funding opportunities across mental health, women's health, men's health, community health, and health equity.
          </p>
          <p className="text-lg text-rose-300 max-w-3xl">
            Every opportunity scored against our 10 health-focused platforms. Your infrastructure is already built — these grants fund the mission.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="section-category-stats">
          {categoryStats.map(cat => (
            <Card
              key={cat.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-lg ${activeCategory === cat.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveCategory(activeCategory === cat.id ? "all" : cat.id)}
              data-testid={`card-category-${cat.id}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <cat.icon className={`h-5 w-5 ${cat.color}`} />
                <span className="text-sm font-semibold">{cat.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{cat.count}</span>
                <Badge variant="outline" className="text-xs">Avg {cat.avgScore}%</Badge>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search grants, funders, focus areas, platforms..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-grants"
            />
          </div>
          <Button
            variant={showEquityOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowEquityOnly(!showEquityOnly)}
            data-testid="button-filter-equity"
          >
            <Scale className="h-4 w-4 mr-1" />
            Equity Focus
          </Button>
          <Button
            variant={showImplSciOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowImplSciOnly(!showImplSciOnly)}
            data-testid="button-filter-impl-sci"
          >
            <Target className="h-4 w-4 mr-1" />
            Implementation Science
          </Button>
          <Badge variant="outline" className="text-xs" data-testid="badge-grant-count">
            {filteredGrants.length} opportunities
          </Badge>
        </div>

        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList data-testid="tabs-healthcare">
            <TabsTrigger value="opportunities" data-testid="tab-opportunities">Grant Opportunities</TabsTrigger>
            <TabsTrigger value="platforms" data-testid="tab-platforms">Platform Strengths</TabsTrigger>
            <TabsTrigger value="strategy" data-testid="tab-strategy">Pursuit Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4">
            {filteredGrants.map((grant) => (
              <Card key={grant.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-grant-${grant.id}`}>
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{grant.name}</h3>
                          <Badge
                            className={`text-xs ${
                              grant.status === "open" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              grant.status === "rolling" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                              "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}
                          >
                            {grant.status === "rolling" ? "Rolling" : grant.status === "open" ? "Open Now" : "Upcoming"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{grant.funder} &middot; {grant.amount}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{grant.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {grant.focus.map((f, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{grant.deadline}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {grant.implementationScience && (
                        <Badge className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                          <Target className="h-3 w-3 mr-1" />
                          Implementation Science
                        </Badge>
                      )}
                      {grant.equityFocus && (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <Scale className="h-3 w-3 mr-1" />
                          Equity Focus
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="md:w-64 p-6 bg-muted/30 border-t md:border-t-0 md:border-l">
                    <div className="text-center mb-3">
                      <div className={`text-3xl font-bold ${getScoreColor(grant.alignmentScore)}`}>
                        {grant.alignmentScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Platform Alignment</div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground">Aligned Platforms:</p>
                      {grant.platformAlignment.map((p, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="text-xs">{p}</span>
                        </div>
                      ))}
                    </div>
                    <a href={grant.url} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                      <Button variant="outline" size="sm" className="w-full text-xs" data-testid={`button-visit-${grant.id}`}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visit Funder
                      </Button>
                    </a>
                  </div>
                </div>
              </Card>
            ))}
            {filteredGrants.length === 0 && (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No matching grants found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="platforms" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Your Healthcare Platform Arsenal</h2>
              <p className="text-muted-foreground mb-6">10 health-focused platforms already built and operational — ready to back any healthcare grant application with live infrastructure.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {PLATFORM_STRENGTHS.map((p, i) => {
                const grantCount = GRANT_OPPORTUNITIES.filter(g => g.platformAlignment.includes(p.platform)).length;
                return (
                  <Card key={i} className="p-5 hover:shadow-lg transition-shadow" data-testid={`card-platform-${i}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <p.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{p.platform}</h3>
                        <p className="text-xs text-muted-foreground">{grantCount} grant alignments</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.capabilities}</p>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Healthcare Grant Pursuit Strategy</h2>
              <p className="text-muted-foreground mb-6">Prioritized approach based on alignment scores, deadlines, and platform readiness.</p>
            </div>

            <Card className="p-6" data-testid="card-top-opportunities">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Top 5 Highest-Alignment Opportunities
              </h3>
              <div className="space-y-3">
                {topAligned.map((grant, i) => (
                  <div key={grant.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50" data-testid={`row-top-grant-${i}`}>
                    <div className={`text-2xl font-bold w-12 text-center ${getScoreColor(grant.alignmentScore)}`}>
                      {grant.alignmentScore}%
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{grant.name}</h4>
                      <p className="text-xs text-muted-foreground">{grant.funder} &middot; {grant.amount}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{grant.deadline}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6" data-testid="card-competitive-edge">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Your Competitive Edge
                </h3>
                <ul className="space-y-3">
                  {[
                    "10 health-focused platforms already operational — not proposed, deployed",
                    "Implementation science frameworks (CFIR, RE-AIM) built into RPLICE",
                    "Multi-provider AI architecture for clinical decision support",
                    "Culturally responsive design across all health platforms",
                    "Three regional hubs with established community relationships",
                    "MAP-GAP continuous improvement already generating evidence",
                    "Bilingual (EN/ES) across all platforms — built-in equity",
                    "Dr. Flood's academic credentials + veteran status + implementation experience",
                  ].map((edge, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{edge}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6" data-testid="card-pursuit-order">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  Recommended Pursuit Order
                </h3>
                <ol className="space-y-3">
                  {[
                    { phase: "Immediate", items: "St. David's Health Equity (opens Mar 30), HRSA Maternal & Child Health" },
                    { phase: "Q2 2026", items: "HRSA CHW Training, SAMHSA Community Mental Health, Hogg Foundation" },
                    { phase: "Q3 2026", items: "CDC Health Disparities, NIMHD Research, PCORI" },
                    { phase: "Ongoing", items: "RWJF Health Equity, Episcopal Health Foundation, Methodist Healthcare" },
                  ].map((phase, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <span className="font-semibold">{phase.phase}:</span>{" "}
                        <span className="text-muted-foreground">{phase.items}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>

            <Card className="p-6 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800" data-testid="card-strategy-note">
              <h3 className="font-bold mb-2">Key Insight</h3>
              <p className="text-sm text-muted-foreground">
                Most healthcare grant applicants propose to build infrastructure. You already have 10 health-focused platforms in production.
                Your applications should lead with "here's what we've already built and what it's already doing" — then explain how the grant
                funding extends reach, deepens impact, and funds the people to operate what's already proven. Infrastructure is your moat.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
