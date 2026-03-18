import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target, Users, CheckCircle2, AlertTriangle, ArrowRight,
  Search, Layers, Briefcase, Shield, Scale, Heart, Globe,
  Activity, FileText, Lightbulb, Zap, BarChart3,
  ChevronRight, ChevronDown, RefreshCw, Handshake,
  ClipboardCheck, BookOpen, Building2, Clock, MapPin,
  Microscope, Brain,
} from "lucide-react";
import { DISCIPLINES } from "@/lib/mvv-content";

type GrantType =
  | "dfc"
  | "wioa"
  | "second-chance"
  | "samhsa"
  | "truist"
  | "custom";

interface GrantProfile {
  id: GrantType;
  name: string;
  fullName: string;
  icon: typeof Target;
  color: string;
  description: string;
  requirements: GrantRequirement[];
  recommendedPartners: string[];
}

interface GrantRequirement {
  id: string;
  category: string;
  requirement: string;
  capabilityMatch: string | null;
  platform: string | null;
  status: "met" | "partial" | "gap";
  notes: string;
}

const GRANT_PROFILES: GrantProfile[] = [
  {
    id: "dfc",
    name: "Drug-Free Communities",
    fullName: "CDC/ONDCP Drug-Free Communities Support Program",
    icon: Shield,
    color: "text-emerald-600",
    description: "Federal grant supporting community coalitions to prevent youth substance use through evidence-based strategies, 12-sector coalition building, and measurable core outcome reduction.",
    recommendedPartners: ["Schools", "Law Enforcement", "Faith-Based Orgs", "Healthcare Providers", "Youth-Serving Orgs", "Parents"],
    requirements: [
      { id: "dfc-1", category: "Coalition Structure", requirement: "12-sector coalition with documented membership", capabilityMatch: "Coalition Dashboard", platform: "ThriveUp Academy", status: "met", notes: "Coalition Dashboard tracks all 12 sectors with member status and engagement metrics." },
      { id: "dfc-2", category: "Coalition Structure", requirement: "Community readiness assessment completed", capabilityMatch: "DFC Readiness Tool", platform: "ThriveUp Academy", status: "met", notes: "DFC Readiness page provides structured readiness assessment workflow." },
      { id: "dfc-3", category: "Prevention Curriculum", requirement: "Evidence-based prevention curriculum delivered with fidelity", capabilityMatch: "Prevention Hub + Facilitator Hub", platform: "ThriveUp Academy", status: "met", notes: "Prevention curriculum delivery with SALP fidelity tracking and dosage monitoring." },
      { id: "dfc-4", category: "Data Collection", requirement: "4 core measures tracked (30-day use, perception of risk, disapproval, age of onset)", capabilityMatch: "DFC Reporting", platform: "ThriveUp Academy", status: "met", notes: "DFC Reporting module tracks all 4 ONDCP core measures with trend analysis." },
      { id: "dfc-5", category: "Reporting", requirement: "Semi-annual progress reports with outcome data", capabilityMatch: "Outcome Reporting", platform: "ThriveUp Academy", status: "met", notes: "Automated outcome reporting generates ONDCP-aligned progress reports." },
      { id: "dfc-6", category: "Parent Engagement", requirement: "Parent education and engagement programming", capabilityMatch: "Parent Education", platform: "ThriveUp Academy", status: "met", notes: "Full parent education module with family assessment and engagement tracking." },
      { id: "dfc-7", category: "Youth Engagement", requirement: "Youth-led prevention activities", capabilityMatch: "Academy Student Portal", platform: "ThriveUp Academy", status: "met", notes: "Student portal with peer-led prevention activities, quests, and engagement." },
      { id: "dfc-8", category: "Community Assessment", requirement: "Environmental scan and community needs assessment", capabilityMatch: "Community Intelligence Map", platform: "ThriveUp Academy", status: "met", notes: "GIS-powered community intelligence with social determinants mapping." },
      { id: "dfc-9", category: "Sustainability", requirement: "Sustainability plan for post-grant continuation", capabilityMatch: null, platform: null, status: "partial", notes: "Logic model and business plan exist but sustainability plan template needs formalization." },
      { id: "dfc-10", category: "Evaluation", requirement: "Independent evaluation partner identified", capabilityMatch: "Better Science Lab", platform: "External", status: "partial", notes: "Better Science Lab provides research infrastructure; independent evaluator recruitment needed." },
    ],
  },
  {
    id: "wioa",
    name: "WIOA Title I",
    fullName: "Workforce Innovation and Opportunity Act — Title I Youth & Adult Programs",
    icon: Briefcase,
    color: "text-blue-600",
    description: "Federal workforce development funding for career pathways, skills training, credential attainment, and employment services for youth and adults facing barriers to employment.",
    recommendedPartners: ["Employers", "Community Colleges", "Workforce Boards", "Vocational Training Centers", "Chambers of Commerce"],
    requirements: [
      { id: "wioa-1", category: "Career Pathways", requirement: "Defined career pathways with stackable credentials", capabilityMatch: "Career Explorer + Pathway Builder", platform: "ThriveUp Academy", status: "met", notes: "50+ career pathways with credential tracking and pathway visualization." },
      { id: "wioa-2", category: "Assessment", requirement: "Comprehensive career assessment and skills inventory", capabilityMatch: "Workforce Assessment", platform: "ThriveUp Academy", status: "met", notes: "Full workforce assessment with skills gap analysis and career matching." },
      { id: "wioa-3", category: "Training", requirement: "Occupational skills training aligned to labor market demand", capabilityMatch: "Workforce Training", platform: "ThriveUp Academy", status: "met", notes: "Training modules aligned to local labor market demand sectors." },
      { id: "wioa-4", category: "Employer Engagement", requirement: "Employer partnerships for work-based learning", capabilityMatch: "Workforce Employers", platform: "ThriveUp Academy", status: "met", notes: "Employer engagement portal with partnership tracking and job placement." },
      { id: "wioa-5", category: "Case Management", requirement: "Individual Employment Plans (IEPs) for each participant", capabilityMatch: "Case Management + Intake Wizard", platform: "ThriveUp Academy", status: "met", notes: "Intake wizard generates IEPs; case management tracks progress." },
      { id: "wioa-6", category: "Performance", requirement: "WIOA performance accountability measures tracked", capabilityMatch: "Workforce Dashboard", platform: "ThriveUp Academy", status: "met", notes: "Dashboard tracks entered employment, median earnings, credential attainment, measurable skill gains." },
      { id: "wioa-7", category: "Supportive Services", requirement: "Supportive services (transportation, childcare, etc.)", capabilityMatch: "LifeBridge + Resource Finder", platform: "External + ThriveUp", status: "partial", notes: "LifeBridge provides resource navigation; direct service funding needs allocation." },
      { id: "wioa-8", category: "Follow-Up", requirement: "12-month follow-up services after program exit", capabilityMatch: "Outcome Reporting", platform: "ThriveUp Academy", status: "partial", notes: "Outcome reporting supports follow-up tracking; automated reminders needed." },
    ],
  },
  {
    id: "second-chance",
    name: "Second Chance Act",
    fullName: "DOJ/OJJDP Second Chance Act — Reentry Programs",
    icon: Scale,
    color: "text-amber-600",
    description: "Federal funding for evidence-based reentry programs that reduce recidivism through employment, housing, substance use treatment, and community reintegration services for returning citizens.",
    recommendedPartners: ["Corrections Departments", "Probation/Parole", "Legal Aid", "Housing Providers", "Employers", "Recovery Programs"],
    requirements: [
      { id: "sca-1", category: "Risk Assessment", requirement: "Validated risk-needs assessment (RNA) for each participant", capabilityMatch: "Reentry Dashboard + Intake Wizard", platform: "ThriveUp Academy", status: "met", notes: "Risk-Needs-Responsivity assessment integrated into intake and reentry dashboard." },
      { id: "sca-2", category: "Reentry Planning", requirement: "Individualized reentry plan with measurable goals", capabilityMatch: "Case Management", platform: "ThriveUp Academy", status: "met", notes: "My Journey and case management create individualized reentry plans with milestones." },
      { id: "sca-3", category: "Employment", requirement: "Employment readiness training and job placement", capabilityMatch: "Workforce Pipeline", platform: "ThriveUp Academy", status: "met", notes: "Full workforce pipeline from assessment through placement with 90-day retention." },
      { id: "sca-4", category: "Housing", requirement: "Housing stability services and referrals", capabilityMatch: "LifeBridge + Resource Finder", platform: "External + ThriveUp", status: "partial", notes: "LifeBridge provides housing navigation; direct housing services need partner allocation." },
      { id: "sca-5", category: "Substance Use", requirement: "Substance use treatment or MAT referrals", capabilityMatch: "Sankofa Health + Prevention Hub", platform: "External + ThriveUp", status: "met", notes: "Sankofa Health Network provides behavioral health assessment and referral pathways." },
      { id: "sca-6", category: "Mentoring", requirement: "Peer mentoring or mentoring services", capabilityMatch: "Mentor Network", platform: "ThriveUp Academy", status: "met", notes: "Mentor finder and network with matching, scheduling, and engagement tracking." },
      { id: "sca-7", category: "Outcome Tracking", requirement: "Recidivism tracking at 6, 12, and 36 months", capabilityMatch: "Outcome Reporting", platform: "ThriveUp Academy", status: "met", notes: "Longitudinal outcome tracking with recidivism monitoring at all required intervals." },
      { id: "sca-8", category: "Stakeholder Coordination", requirement: "Multi-agency coordination with corrections, courts, community", capabilityMatch: "Justice Partners + Coalition", platform: "ThriveUp Academy", status: "met", notes: "Justice partners portal with cross-agency coordination and shared dashboards." },
      { id: "sca-9", category: "CBT/Cognitive", requirement: "Cognitive-behavioral intervention programming", capabilityMatch: null, platform: null, status: "gap", notes: "CBT curriculum content needs development or licensed program integration." },
    ],
  },
  {
    id: "samhsa",
    name: "SAMHSA Community",
    fullName: "SAMHSA Community Mental Health Services Block Grant",
    icon: Heart,
    color: "text-rose-600",
    description: "Federal block grant for community-based mental health services, substance abuse prevention, and behavioral health system development for underserved populations.",
    recommendedPartners: ["Mental Health Providers", "Community Health Centers", "Recovery Organizations", "Crisis Centers", "Schools"],
    requirements: [
      { id: "sam-1", category: "Needs Assessment", requirement: "Community behavioral health needs assessment", capabilityMatch: "Community Intelligence Map + GIS Engine", platform: "ThriveUp Academy", status: "met", notes: "GIS-powered mapping of behavioral health needs with social determinants overlay." },
      { id: "sam-2", category: "Service Delivery", requirement: "Evidence-based mental health service delivery", capabilityMatch: "Health & Wellness Hub", platform: "ThriveUp + Sankofa", status: "met", notes: "Sankofa Health Network provides behavioral health assessments and wellness content." },
      { id: "sam-3", category: "Prevention", requirement: "Substance abuse prevention programming", capabilityMatch: "Prevention Hub + Prevention Strategies", platform: "ThriveUp Academy", status: "met", notes: "Full prevention curriculum with SAMHSA Strategic Prevention Framework alignment." },
      { id: "sam-4", category: "Crisis Services", requirement: "Crisis intervention and 24/7 support access", capabilityMatch: "LifeBridge", platform: "External", status: "partial", notes: "LifeBridge provides 24/7 resource navigation; clinical crisis services need partner allocation." },
      { id: "sam-5", category: "Workforce", requirement: "Behavioral health workforce development", capabilityMatch: "CHW Dashboard + Facilitator Hub", platform: "ThriveUp Academy", status: "met", notes: "CHW training pipeline and facilitator credentialing support behavioral health workforce." },
      { id: "sam-6", category: "Data", requirement: "NOMS (National Outcome Measures) data collection", capabilityMatch: "Outcome Reporting", platform: "ThriveUp Academy", status: "partial", notes: "Outcome reporting framework exists; NOMS-specific data fields need mapping." },
      { id: "sam-7", category: "Cultural Competency", requirement: "Culturally responsive service delivery", capabilityMatch: "Accessibility + i18n", platform: "ThriveUp Academy", status: "met", notes: "Multi-language support, cultural adaptation through Three Realities framework." },
    ],
  },
  {
    id: "truist",
    name: "Truist Foundation",
    fullName: "Truist Foundation — Nonprofit Community Grant (Deadline March 31)",
    icon: Building2,
    color: "text-purple-600",
    description: "Private foundation grant for nonprofits focused on building career pathways, supporting economic mobility, strengthening small businesses, and community program development. Funds launching new programs, expanding existing initiatives, equipment/resources, and sustainable community projects.",
    recommendedPartners: ["Workforce Boards", "Small Business Development Centers", "Community Colleges", "Chambers of Commerce", "Economic Development Agencies", "Minority Business Orgs"],
    requirements: [
      { id: "tru-1", category: "Career Pathways", requirement: "Programs that build career pathways for underserved populations", capabilityMatch: "Career Explorer + Pathway Builder", platform: "ThriveUp Academy", status: "met", notes: "50+ career pathways with credential tracking, skills assessment, and individualized pathway plans." },
      { id: "tru-2", category: "Career Pathways", requirement: "Workforce skills training aligned to employer demand", capabilityMatch: "Workforce Training + Assessment", platform: "ThriveUp Academy", status: "met", notes: "Full workforce training pipeline with labor market alignment and employer partnerships." },
      { id: "tru-3", category: "Economic Mobility", requirement: "Financial literacy and economic empowerment programming", capabilityMatch: "Financial Literacy Module", platform: "ThriveUp Academy", status: "met", notes: "Academy financial literacy module with budgeting, savings, and investment education." },
      { id: "tru-4", category: "Economic Mobility", requirement: "Measurable economic mobility outcomes for participants", capabilityMatch: "Outcome Reporting + Workforce Dashboard", platform: "ThriveUp Academy", status: "met", notes: "Workforce dashboard tracks employment, wage progression, and credential attainment with longitudinal follow-up." },
      { id: "tru-5", category: "Small Business", requirement: "Small business development and entrepreneurship support", capabilityMatch: "MCE Platform", platform: "MCE (Minority Capital Exchange)", status: "met", notes: "MCE SaaS platform provides minority business support, APEX Accelerators, and contracting resources." },
      { id: "tru-6", category: "Small Business", requirement: "Minority and veteran-owned business capacity building", capabilityMatch: "APEX Accelerators + VOSB", platform: "MCE + The Collaborative Advocate", status: "met", notes: "APEX Accelerators page and VOSB designation provide direct minority/veteran business support infrastructure." },
      { id: "tru-7", category: "Community Programs", requirement: "Evidence-based community program design and delivery", capabilityMatch: "Program Designer + Prevention Hub", platform: "ThriveUp Academy", status: "met", notes: "MAP-GAP-driven program design with SALP fidelity tracking and evidence-based curriculum delivery." },
      { id: "tru-8", category: "Community Programs", requirement: "Community needs assessment and data-driven planning", capabilityMatch: "Community Intelligence Map + GIS", platform: "ThriveUp Academy", status: "met", notes: "GIS-powered community intelligence with social determinants mapping and needs assessment tools." },
      { id: "tru-9", category: "Sustainability", requirement: "Sustainability plan for program continuation beyond grant", capabilityMatch: "Business Plan + Logic Model", platform: "ThriveUp Academy", status: "partial", notes: "Business plan and logic model exist; specific revenue diversification strategy needs formalization for Truist reporting." },
      { id: "tru-10", category: "Impact Measurement", requirement: "Demonstrated impact measurement and reporting capability", capabilityMatch: "Transparency Dashboard + Platform Metrics", platform: "ThriveUp Academy", status: "met", notes: "Real-time transparency dashboard with role-based views, SMART goals, and SALP fidelity indicators." },
      { id: "tru-11", category: "Impact Measurement", requirement: "Program expansion or launch readiness documentation", capabilityMatch: "Program Lifecycle + Phased Rollout", platform: "ThriveUp Academy", status: "met", notes: "Program lifecycle pipeline with phased rollout planning and readiness assessment tools." },
      { id: "tru-12", category: "Equipment & Resources", requirement: "Equipment and resource needs documentation", capabilityMatch: null, platform: null, status: "partial", notes: "Technology infrastructure documented in business plan; specific equipment/resource budget template needs creation." },
    ],
  },
];

interface CapabilityArea {
  id: string;
  name: string;
  icon: typeof Target;
  color: string;
  capabilities: string[];
  platforms: string[];
  disciplines: string[];
}

const CAPABILITY_INVENTORY: CapabilityArea[] = [
  {
    id: "prevention",
    name: "Prevention & Curriculum",
    icon: Shield,
    color: "text-emerald-600",
    capabilities: [
      "Evidence-based prevention curriculum delivery",
      "SALP fidelity tracking for curriculum adherence",
      "Dosage hour monitoring per participant",
      "Parent education modules with family assessment",
      "Social media literacy programming",
      "STAAR test prep and academic support",
    ],
    platforms: ["ThriveUp Academy", "WholeMind Learning"],
    disciplines: ["implementation-science", "io-psychology"],
  },
  {
    id: "workforce",
    name: "Workforce Development",
    icon: Briefcase,
    color: "text-blue-600",
    capabilities: [
      "50+ career pathway visualization and tracking",
      "Skills assessment and gap analysis",
      "Credential attainment tracking",
      "Employer engagement and job placement",
      "Military-to-civilian career translation",
      "Financial literacy education",
    ],
    platforms: ["ThriveUp Academy", "MCE", "M2C Transition"],
    disciplines: ["hr-management", "io-psychology"],
  },
  {
    id: "case-management",
    name: "Case Management & Reentry",
    icon: ClipboardCheck,
    color: "text-amber-600",
    capabilities: [
      "Intake wizard with risk-needs assessment",
      "Individualized service plans with milestones",
      "Longitudinal outcome tracking (6/12/36 months)",
      "Cross-agency referral coordination",
      "Recidivism monitoring and reporting",
      "Mentor matching and engagement tracking",
    ],
    platforms: ["ThriveUp Academy", "SafeReport"],
    disciplines: ["criminal-justice", "implementation-science"],
  },
  {
    id: "coalition",
    name: "Coalition & Stakeholder Management",
    icon: Users,
    color: "text-violet-600",
    capabilities: [
      "12-sector coalition tracking and management",
      "DFC Command Center with reporting tools",
      "Stakeholder transparency dashboard",
      "SMART goal tracking visible to all partners",
      "Advisory board management",
      "Community partner network coordination",
    ],
    platforms: ["ThriveUp Academy"],
    disciplines: ["implementation-science", "hr-management"],
  },
  {
    id: "health",
    name: "Health & Wellness",
    icon: Heart,
    color: "text-rose-600",
    capabilities: [
      "Behavioral health assessment and screening",
      "GIS-based health resource mapping",
      "Black maternal health resources",
      "Medication management and reminders",
      "Cognitive safety monitoring",
      "Community health worker training pipeline",
    ],
    platforms: ["Sankofa Health", "LifeBridge", "PillScheduler", "SafeCogniCare"],
    disciplines: ["implementation-science"],
  },
  {
    id: "data-reporting",
    name: "Data, Reporting & Analytics",
    icon: BarChart3,
    color: "text-indigo-600",
    capabilities: [
      "Real-time platform metrics dashboard",
      "Outcome reporting with export capabilities",
      "Dosage tracking and service delivery logs",
      "Grant narrative auto-generation",
      "MAP-GAP continuous quality improvement",
      "Logic model visualization",
    ],
    platforms: ["ThriveUp Academy", "Better Science Lab"],
    disciplines: ["implementation-science", "io-psychology"],
  },
  {
    id: "community-intel",
    name: "Community Intelligence",
    icon: Globe,
    color: "text-teal-600",
    capabilities: [
      "GIS-powered community resource mapping",
      "Social determinants of health data overlay",
      "24/7 virtual 211 resource navigation",
      "Community needs assessment tools",
      "Resource finder with proximity search",
      "Incident reporting and tracking",
    ],
    platforms: ["ThriveUp Academy", "LifeBridge", "SafeReport"],
    disciplines: ["implementation-science", "criminal-justice"],
  },
  {
    id: "engagement",
    name: "Engagement & Retention",
    icon: Zap,
    color: "text-orange-600",
    capabilities: [
      "Gamified learning with badges and achievements",
      "Thrive scoring across 5 wellbeing domains",
      "Daily quests and check-ins",
      "Peer competitions and house points",
      "AI companion for personalized guidance",
      "Student journal and reflection tools",
    ],
    platforms: ["ThriveUp Academy"],
    disciplines: ["io-psychology"],
  },
];

function getStatusBadge(status: "met" | "partial" | "gap") {
  switch (status) {
    case "met":
      return { label: "Capability Met", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 };
    case "partial":
      return { label: "Partial Match", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle };
    case "gap":
      return { label: "Gap Identified", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle };
  }
}

function GrantSelector({ selected, onSelect }: { selected: GrantType | null; onSelect: (g: GrantType) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-grant-selector">
      {GRANT_PROFILES.map((grant) => {
        const Icon = grant.icon;
        const isSelected = selected === grant.id;
        return (
          <Card
            key={grant.id}
            className={`cursor-pointer transition-all hover-elevate ${isSelected ? "ring-2 ring-primary" : ""}`}
            onClick={() => onSelect(grant.id)}
            data-testid={`card-grant-${grant.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-md bg-primary/10 p-2 shrink-0">
                  <Icon className={`h-5 w-5 ${grant.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{grant.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{grant.fullName}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{grant.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RequirementMapper({ grant }: { grant: GrantProfile }) {
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const metCount = grant.requirements.filter(r => r.status === "met").length;
  const partialCount = grant.requirements.filter(r => r.status === "partial").length;
  const gapCount = grant.requirements.filter(r => r.status === "gap").length;
  const totalCount = grant.requirements.length;
  const readinessScore = Math.round(((metCount + partialCount * 0.5) / totalCount) * 100);

  const categories = Array.from(new Set(grant.requirements.map(r => r.category)));

  return (
    <div className="space-y-6" data-testid="section-requirement-mapper">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{readinessScore}%</p>
            <p className="text-sm text-muted-foreground">Readiness Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{metCount}</p>
            <p className="text-sm text-muted-foreground">Requirements Met</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{partialCount}</p>
            <p className="text-sm text-muted-foreground">Partial Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{gapCount}</p>
            <p className="text-sm text-muted-foreground">Gaps Identified</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-readiness-progress">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Overall Grant Readiness</span>
            <span className="text-sm font-bold text-primary">{readinessScore}%</span>
          </div>
          <Progress value={readinessScore} className="h-3" />
          <div className="flex items-center justify-between gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {metCount} met</span>
            <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> {partialCount} partial</span>
            <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-500" /> {gapCount} gaps</span>
          </div>
        </CardContent>
      </Card>

      {categories.map((category) => {
        const catReqs = grant.requirements.filter(r => r.category === category);
        return (
          <Card key={category} data-testid={`card-category-${category.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {catReqs.map((req) => {
                const statusConfig = getStatusBadge(req.status);
                const StatusIcon = statusConfig.icon;
                const isExpanded = expandedReq === req.id;
                return (
                  <div
                    key={req.id}
                    className="rounded-md border p-3 cursor-pointer hover-elevate"
                    onClick={() => setExpandedReq(isExpanded ? null : req.id)}
                    data-testid={`row-requirement-${req.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <StatusIcon className={`h-4 w-4 shrink-0 mt-0.5 ${
                          req.status === "met" ? "text-emerald-500" : req.status === "partial" ? "text-amber-500" : "text-red-500"
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{req.requirement}</p>
                          {req.capabilityMatch && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Matched: {req.capabilityMatch} {req.platform && `(${req.platform})`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        <p>{req.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CapabilityInventoryView() {
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  return (
    <div className="space-y-4" data-testid="section-capability-inventory">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAPABILITY_INVENTORY.map((area) => {
          const Icon = area.icon;
          const isExpanded = expandedArea === area.id;
          return (
            <Card
              key={area.id}
              className={`cursor-pointer hover-elevate transition-all ${isExpanded ? "ring-2 ring-primary/30 md:col-span-2" : ""}`}
              onClick={() => setExpandedArea(isExpanded ? null : area.id)}
              data-testid={`card-capability-${area.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2 shrink-0">
                      <Icon className={`h-5 w-5 ${area.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{area.name}</h3>
                      <p className="text-xs text-muted-foreground">{area.capabilities.length} capabilities</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {area.platforms.map((p) => (
                    <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {area.disciplines.map((dId) => {
                    const disc = DISCIPLINES.find(d => d.id === dId);
                    return disc ? (
                      <span key={dId} className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${disc.color}`}>
                        {disc.shortName}
                      </span>
                    ) : null;
                  })}
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    {area.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function GapAnalysisMatrix({ grant }: { grant: GrantProfile }) {
  const gaps = grant.requirements.filter(r => r.status === "gap");
  const partials = grant.requirements.filter(r => r.status === "partial");

  const recommendations: Array<{
    gap: string;
    recommendation: string;
    type: "build" | "partner" | "license";
    effort: "low" | "medium" | "high";
    timeline: string;
  }> = [];

  gaps.forEach(g => {
    recommendations.push({
      gap: g.requirement,
      recommendation: `Develop or license capability to address: ${g.requirement}`,
      type: "build",
      effort: "high",
      timeline: "3-6 months",
    });
  });

  partials.forEach(p => {
    recommendations.push({
      gap: p.requirement,
      recommendation: `Strengthen existing capability: ${p.capabilityMatch || p.requirement}. ${p.notes}`,
      type: p.capabilityMatch ? "build" : "partner",
      effort: "medium",
      timeline: "1-3 months",
    });
  });

  return (
    <div className="space-y-6" data-testid="section-gap-analysis">
      {gaps.length === 0 && partials.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">All Requirements Met</h3>
            <p className="text-sm text-muted-foreground mt-1">No gaps identified for this grant type.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {gaps.length > 0 && (
            <Card data-testid="card-critical-gaps">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Critical Gaps ({gaps.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gaps.map((gap) => (
                  <div key={gap.id} className="p-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                    <p className="text-sm font-medium">{gap.requirement}</p>
                    <p className="text-xs text-muted-foreground mt-1">{gap.notes}</p>
                    <Badge variant="outline" className="mt-2 text-[10px]">{gap.category}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {partials.length > 0 && (
            <Card data-testid="card-partial-gaps">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Partial Matches ({partials.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {partials.map((partial) => (
                  <div key={partial.id} className="p-3 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                    <p className="text-sm font-medium">{partial.requirement}</p>
                    <p className="text-xs text-muted-foreground mt-1">{partial.notes}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{partial.category}</Badge>
                      {partial.capabilityMatch && (
                        <Badge variant="secondary" className="text-[10px]">{partial.capabilityMatch}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-recommendations">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-primary" />
                Recommendations to Close Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="p-3 rounded-md border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{rec.gap}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.recommendation}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-[10px]">
                        {rec.type === "build" ? "Build" : rec.type === "partner" ? "Partner" : "License"}
                      </Badge>
                      <span className={`text-[10px] font-medium ${
                        rec.effort === "low" ? "text-emerald-600" : rec.effort === "medium" ? "text-amber-600" : "text-red-600"
                      }`}>
                        {rec.effort} effort
                      </span>
                      <span className="text-[10px] text-muted-foreground">{rec.timeline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <Card data-testid="card-recommended-partners">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Handshake className="h-4 w-4 text-primary" />
            Recommended Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {grant.recommendedPartners.map((partner) => (
              <Badge key={partner} variant="secondary" className="text-xs">
                {partner}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExecutionPlanBuilder({ grant }: { grant: GrantProfile }) {
  const phases = [
    {
      phase: 1,
      title: "Assessment & Planning",
      subtitle: "MAP-GAP Steps 1-2",
      timeline: "Months 1-2",
      color: "from-blue-500 to-blue-600",
      tasks: [
        "Complete community needs assessment using GIS Community Intelligence Map",
        "Run MAP-GAP gap analysis against grant requirements",
        "Identify and recruit recommended partners",
        "Develop logic model aligned to grant outcomes",
        "Draft grant narrative using Narrative Builder",
      ],
      tools: ["Community Intelligence Map", "MAP-GAP CQI", "Logic Model", "Grant Narrative Builder"],
    },
    {
      phase: 2,
      title: "Coalition & Stakeholder Setup",
      subtitle: "MAP-GAP Step 3",
      timeline: "Months 2-3",
      color: "from-violet-500 to-violet-600",
      tasks: [
        "Establish coalition structure with all required sectors",
        "Set up shared SMART goals in Transparency Dashboard",
        "Configure stakeholder dashboards with role-based views",
        "Execute MOUs/partnership agreements with key partners",
        "Launch Advisory Board with quarterly meeting cadence",
      ],
      tools: ["Coalition Dashboard", "Transparency Dashboard", "Advisory Board", "DFC Command Center"],
    },
    {
      phase: 3,
      title: "Program Design & Staff Training",
      subtitle: "MAP-GAP Steps 2-3",
      timeline: "Months 3-4",
      color: "from-emerald-500 to-emerald-600",
      tasks: [
        "Select and adapt evidence-based curricula through Three Realities analysis",
        "Define SALP fidelity indicators for all program components",
        "Train facilitators and case managers through Facilitator Hub",
        "Configure dosage tracking and outcome measurement tools",
        "Set up intake workflow and participant onboarding",
      ],
      tools: ["Facilitator Hub", "Prevention Hub", "Intake Wizard", "Dosage Report"],
    },
    {
      phase: 4,
      title: "Launch & Execute",
      subtitle: "MAP-GAP Step 4",
      timeline: "Months 4-12",
      color: "from-amber-500 to-amber-600",
      tasks: [
        "Begin program delivery with fidelity monitoring active",
        "Track participant engagement and dosage hours in real time",
        "Conduct monthly SALP adherence reviews",
        "Generate quarterly progress reports for funders",
        "Monitor early warning indicators through Thrive scoring",
      ],
      tools: ["SALP Fidelity", "Dosage Tracking", "Outcome Reporting", "Thrive Dashboard"],
    },
    {
      phase: 5,
      title: "Measure, Improve & Report",
      subtitle: "MAP-GAP Steps 5-6",
      timeline: "Months 6-12+",
      color: "from-rose-500 to-rose-600",
      tasks: [
        "Conduct quarterly outcome reviews using MAP-GAP CQI",
        "Generate funder-facing reports through Transparency Dashboard",
        "Document lessons learned for MG-PATR replication",
        "Adjust programming based on continuous quality improvement data",
        "Prepare sustainability plan for post-grant continuation",
      ],
      tools: ["MAP-GAP CQI", "Transparency Dashboard", "Platform Metrics", "Research Hub"],
    },
  ];

  return (
    <div className="space-y-6" data-testid="section-execution-plan">
      <Card data-testid="card-execution-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="h-5 w-5 text-primary" />
            Execution Plan: {grant.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            MAP-GAP-driven execution timeline mapping grant requirements to platform capabilities and stakeholder coordination.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {phases.map((phase) => (
            <div key={phase.phase} className="relative" data-testid={`card-phase-${phase.phase}`}>
              <div className="flex items-start gap-4">
                <div className={`rounded-full bg-gradient-to-br ${phase.color} p-3 shrink-0`}>
                  <span className="text-white font-bold text-sm">{phase.phase}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold">{phase.title}</h3>
                      <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {phase.timeline}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {phase.tasks.map((task, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {phase.tools.map((tool) => (
                      <span key={tool} className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground font-medium">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {phase.phase < phases.length && (
                <div className="absolute left-5 top-14 bottom-0 w-px bg-border" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/transparency">
          <Button variant="outline" size="sm" data-testid="button-to-transparency">
            <Activity className="mr-2 h-4 w-4" /> Transparency Dashboard
          </Button>
        </Link>
        <Link href="/cqi">
          <Button variant="outline" size="sm" data-testid="button-to-cqi">
            <RefreshCw className="mr-2 h-4 w-4" /> MAP-GAP CQI
          </Button>
        </Link>
        <Link href="/logic-model">
          <Button variant="outline" size="sm" data-testid="button-to-logic-model">
            <Layers className="mr-2 h-4 w-4" /> Logic Model
          </Button>
        </Link>
        <Link href="/grant-narrative">
          <Button variant="outline" size="sm" data-testid="button-to-narrative">
            <FileText className="mr-2 h-4 w-4" /> Grant Narrative
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ProgramDesignerPage() {
  const [selectedGrant, setSelectedGrant] = useState<GrantType | null>(null);
  const [activeTab, setActiveTab] = useState("requirements");

  const grant = selectedGrant ? GRANT_PROFILES.find(g => g.id === selectedGrant) : null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="page-program-designer">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Search className="h-6 w-6 text-primary" />
          Interactive Program Designer
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
          MAP-GAP-driven grant capability mapping. Select a grant type to inventory platform capabilities against requirements, identify gaps, and build an execution plan.
        </p>
      </div>

      <Card data-testid="card-grant-selection">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Step 1: Select Grant / Program Type
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a federal grant program to map platform capabilities against its requirements.
          </p>
        </CardHeader>
        <CardContent>
          <GrantSelector selected={selectedGrant} onSelect={setSelectedGrant} />
        </CardContent>
      </Card>

      {grant && (
        <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-designer-workflow">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="requirements" data-testid="tab-requirements">
              <ClipboardCheck className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Requirements</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" data-testid="tab-inventory">
              <Layers className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="gaps" data-testid="tab-gaps">
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Gap Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="plan" data-testid="tab-plan">
              <ArrowRight className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Execution Plan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requirements" className="mt-6">
            <RequirementMapper grant={grant} />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <CapabilityInventoryView />
          </TabsContent>

          <TabsContent value="gaps" className="mt-6">
            <GapAnalysisMatrix grant={grant} />
          </TabsContent>

          <TabsContent value="plan" className="mt-6">
            <ExecutionPlanBuilder grant={grant} />
          </TabsContent>
        </Tabs>
      )}

      {!grant && (
        <Card className="border-dashed" data-testid="card-empty-state">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Select a Grant Type to Begin</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Choose a federal grant program above to see how platform capabilities map against its requirements,
              identify gaps, and generate an execution plan using the MAP-GAP framework.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
