import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DFCCrossNav } from "@/components/dfc-cross-nav";
import {
  Home, Briefcase, Apple, Shield, AlertTriangle, Users, Scale,
  HeartPulse, Brain, GraduationCap, Globe, Phone, ExternalLink,
  Search, ChevronRight, Heart, Baby, Building2, Flag,
  HandHeart, Stethoscope, Accessibility, BookOpen, ArrowRight,
  Loader2, MapPin, Clock, CheckCircle2, Zap, HelpCircle,
  PhoneCall, MessageCircle
} from "lucide-react";

const CRISIS_LINES = [
  { label: "Emergency", number: "911", description: "Life-threatening emergency", color: "bg-red-600" },
  { label: "2-1-1 Texas", number: "211", description: "Connect to local services", color: "bg-blue-600" },
  { label: "988 Lifeline", number: "988", description: "Suicide & mental health crisis", color: "bg-purple-600" },
  { label: "Crisis Text", number: "Text HOME to 741741", description: "Crisis text line", color: "bg-green-600" },
  { label: "Domestic Violence", number: "1-800-799-7233", description: "National DV hotline", color: "bg-orange-600" },
  { label: "Human Trafficking", number: "1-888-373-7888", description: "National trafficking hotline", color: "bg-red-700" },
];

interface ServiceCategory {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  services: Array<{
    name: string;
    description: string;
    internalLink?: string;
    externalLink?: string;
    platform?: string;
  }>;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "benefits", label: "Apply for Benefits", icon: Shield, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/20",
    description: "SNAP, Medicaid, CHIP, TANF, WIC, EITC, and more — check what you qualify for and apply",
    services: [
      { name: "Benefits Screener", description: "Check eligibility for 9 federal and state programs in minutes", internalLink: "/benefits-screener", platform: "ThriveUp Hub" },
      { name: "YourTexasBenefits.com", description: "Official Texas HHS portal — apply for SNAP, Medicaid, TANF, and manage your benefits", externalLink: "https://www.yourtexasbenefits.com" },
      { name: "Benefits Intelligence Dashboard", description: "See enrollment gaps and available programs in your county", internalLink: "/benefits", platform: "Benefits Intel" },
      { name: "Healthcare.gov", description: "Marketplace health insurance — open enrollment and special enrollment periods", externalLink: "https://www.healthcare.gov" },
      { name: "EITC/CTC Calculator", description: "Check if you qualify for Earned Income Tax Credit or Child Tax Credit", externalLink: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc" },
    ],
  },
  {
    id: "housing", label: "Housing & Shelter", icon: Home, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/20",
    description: "Emergency shelter, affordable housing, rent assistance, utility help, and housing repair",
    services: [
      { name: "Texas 2-1-1 Housing", description: "Call 2-1-1 for immediate housing and shelter referrals in your area", externalLink: "https://www.211texas.org" },
      { name: "Austin Housing Initiative", description: "Local housing resources, affordable units, and community land trusts", internalLink: "/austin", platform: "LifeBridge" },
      { name: "SSVF (Veterans Housing)", description: "Supportive Services for Veteran Families — rapid re-housing and homelessness prevention", externalLink: "https://www.va.gov/homeless/ssvf/" },
      { name: "HUD Resource Locator", description: "Find HUD-approved housing counseling agencies near you", externalLink: "https://www.hud.gov/findhelp" },
      { name: "Resource Finder — Housing", description: "Search housing resources by state", internalLink: "/resources", platform: "LifeBridge" },
    ],
  },
  {
    id: "employment", label: "Employment & Workforce", icon: Briefcase, color: "text-indigo-600", bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    description: "Job search, resume help, workforce training, career readiness, and entrepreneurship",
    services: [
      { name: "AI Workforce Academy", description: "Skills assessment, career pathways, and AI-powered job matching", internalLink: "/ai-workforce", platform: "MCE" },
      { name: "WorkInTexas.com", description: "Official Texas workforce job board — search jobs and post resumes", externalLink: "https://www.workintexas.com" },
      { name: "PM Academy", description: "Project management certification preparation and professional development", internalLink: "/pm-academy", platform: "ThriveUp Hub" },
      { name: "Military Transition", description: "Skills translation, benefits navigation, and career support for veterans", internalLink: "/ecosystem", platform: "M2C Transition" },
      { name: "Minority Center of Excellence", description: "Business certification, procurement access, and economic empowerment", internalLink: "/ecosystem", platform: "MCE" },
      { name: "Resource Finder — Workforce", description: "Search employment resources by state", internalLink: "/resources", platform: "LifeBridge" },
    ],
  },
  {
    id: "food", label: "Food & Nutrition", icon: Apple, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/20",
    description: "Food pantries, SNAP enrollment, WIC, community meals, and nutrition services",
    services: [
      { name: "SNAP Screener", description: "Check if you qualify for SNAP (food stamps) — takes 2 minutes", internalLink: "/benefits-screener", platform: "Benefits Intel" },
      { name: "WIC Eligibility Check", description: "Women, Infants, and Children nutrition program — income-based", internalLink: "/benefits-screener", platform: "Benefits Intel" },
      { name: "Central Texas Food Bank", description: "Find food pantries and distribution sites in the Austin metro area", externalLink: "https://www.centraltexasfoodbank.org/get-help" },
      { name: "Feeding America Locator", description: "Find your nearest food bank anywhere in the United States", externalLink: "https://www.feedingamerica.org/find-your-local-foodbank" },
      { name: "Texas 2-1-1 Food", description: "Call 2-1-1 for food assistance in your area", externalLink: "https://www.211texas.org" },
    ],
  },
  {
    id: "healthcare", label: "Healthcare", icon: HeartPulse, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/20",
    description: "Health insurance enrollment, clinics, dental, family planning, maternal health, and chronic disease",
    services: [
      { name: "Medicaid/CHIP Screener", description: "Check eligibility for Medicaid and Children's Health Insurance Program", internalLink: "/benefits-screener", platform: "Benefits Intel" },
      { name: "Whole-Person Health", description: "Health screenings (PHQ-9, GAD-7), safety planning, and resource routing", internalLink: "/ecosystem", platform: "Whole-Person Health" },
      { name: "Sankofa Health Network", description: "Cultural health equity — addressing health disparities in communities of color", internalLink: "/ecosystem", platform: "Sankofa" },
      { name: "Black Maternal Health", description: "Prenatal, postpartum, and maternal care pathways for women of color", internalLink: "/ecosystem", platform: "Sankofa Maternal" },
      { name: "HRSA Health Center Finder", description: "Find federally qualified health centers — sliding scale, no one turned away", externalLink: "https://findahealthcenter.hrsa.gov/" },
      { name: "Healthy Texas Women", description: "Family planning, preventive care, and birth control for eligible Texas women", externalLink: "https://healthytexaswomen.org/" },
    ],
  },
  {
    id: "mental-health", label: "Mental Health & Counseling", icon: Brain, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/20",
    description: "Behavioral health, addiction services, counseling, crisis support, and PTSD treatment",
    services: [
      { name: "988 Suicide & Crisis Lifeline", description: "Call or text 988 — free, confidential, 24/7 support", externalLink: "https://988lifeline.org" },
      { name: "Whole-Person Health Screening", description: "PHQ-9 depression and GAD-7 anxiety screenings with resource routing", internalLink: "/ecosystem", platform: "Whole-Person Health" },
      { name: "SAMHSA Treatment Locator", description: "Find substance abuse and mental health treatment facilities near you", externalLink: "https://findtreatment.gov/" },
      { name: "SafeCogniCare", description: "Cognitive health support for TBI, dementia, and memory care", internalLink: "/ecosystem", platform: "SafeCogniCare" },
      { name: "Veterans Crisis Line", description: "Call 988 then press 1 — for veterans, service members, and families", externalLink: "https://www.veteranscrisisline.net/" },
      { name: "NAMI Texas", description: "National Alliance on Mental Illness — support groups, education, and advocacy", externalLink: "https://namitexas.org/" },
    ],
  },
  {
    id: "veterans", label: "Veteran Services", icon: Flag, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    description: "VA benefits, military transition, veteran housing, employment, health, and family support",
    services: [
      { name: "M2C Military Transition", description: "Skills translation, benefits navigation, and career pathways for veterans", internalLink: "/ecosystem", platform: "M2C Transition" },
      { name: "VA Benefits Screener", description: "Check eligibility for VA healthcare, disability, education, and pension", internalLink: "/benefits-screener", platform: "Benefits Intel" },
      { name: "VA.gov", description: "Official Department of Veterans Affairs — apply for all VA benefits", externalLink: "https://www.va.gov" },
      { name: "eBenefits", description: "Access your VA benefits, claims status, and service records", externalLink: "https://www.ebenefits.va.gov" },
      { name: "SSVF Veterans Housing", description: "Rapid re-housing and homelessness prevention for veteran families", externalLink: "https://www.va.gov/homeless/ssvf/" },
      { name: "Vet Center Locator", description: "Readjustment counseling — community-based, no VA enrollment needed", externalLink: "https://www.vetcenter.va.gov/" },
    ],
  },
  {
    id: "education", label: "Education & Literacy", icon: GraduationCap, color: "text-violet-600", bgColor: "bg-violet-50 dark:bg-violet-950/20",
    description: "K-12 support, adult education, GED, college, Head Start, literacy, and special education",
    services: [
      { name: "ISSS Student Support", description: "K-12 student support, MTSS compliance, and progressive learning models", internalLink: "/ecosystem", platform: "ISSS" },
      { name: "Perfectly Different", description: "Neurodiversity support — Autism, ADHD, IEP/504 assistance, sensory-friendly resources", internalLink: "/ecosystem", platform: "Perfectly Different" },
      { name: "FAFSA Application", description: "Free Application for Federal Student Aid — college financial aid", externalLink: "https://studentaid.gov/h/apply-for-aid/fafsa" },
      { name: "Texas Head Start Locator", description: "Find Head Start and Early Head Start programs for children 0-5", externalLink: "https://eclkc.ohs.acf.hhs.gov/center-locator" },
      { name: "Resource Finder — Education", description: "Search education resources by state", internalLink: "/resources", platform: "LifeBridge" },
    ],
  },
  {
    id: "social-services", label: "Social Services & Family", icon: HandHeart, color: "text-pink-600", bgColor: "bg-pink-50 dark:bg-pink-950/20",
    description: "Case management, child care, financial literacy, clothing, home visits, and family support",
    services: [
      { name: "Life Transitions Aid", description: "Virtual 2-1-1 — comprehensive resource navigation for any life challenge", internalLink: "/resources", platform: "LifeBridge" },
      { name: "Community Resource Directory", description: "National organizations with local chapters — civil rights, legal aid, chambers, faith-based", internalLink: "/resource-directory", platform: "LifeBridge" },
      { name: "Child Care Assistance", description: "Texas Workforce Commission child care services for eligible families", externalLink: "https://www.twc.texas.gov/programs/childcare" },
      { name: "TANF Cash Assistance", description: "Temporary Assistance for Needy Families — check eligibility", internalLink: "/benefits-screener", platform: "Benefits Intel" },
      { name: "2-1-1 Texas", description: "Call 2-1-1 for any social service need — available 24/7", externalLink: "https://www.211texas.org" },
    ],
  },
  {
    id: "aging", label: "Aging & Disability", icon: Accessibility, color: "text-teal-600", bgColor: "bg-teal-50 dark:bg-teal-950/20",
    description: "Senior services, disability resources, long-term care, cognitive health, medication management",
    services: [
      { name: "SafeCogniCare", description: "Cognitive health for TBI and dementia — memory aids, caregiver support, conduct scoring", internalLink: "/ecosystem", platform: "SafeCogniCare" },
      { name: "Perfectly Different", description: "Neurodiversity support — Autism, ADHD, IEP/504 assistance", internalLink: "/ecosystem", platform: "Perfectly Different" },
      { name: "SSI/SSDI Screener", description: "Check eligibility for Supplemental Security Income and Social Security Disability", internalLink: "/benefits-screener", platform: "Benefits Intel" },
      { name: "Eldercare Locator", description: "Connect to local Area Agency on Aging for senior services", externalLink: "https://eldercare.acl.gov/" },
      { name: "Texas DADS Services", description: "Texas aging and disability services — in-home support, community programs", externalLink: "https://www.hhs.texas.gov/services/aging" },
    ],
  },
  {
    id: "legal", label: "Legal Aid & Criminal Justice", icon: Scale, color: "text-slate-600", bgColor: "bg-slate-50 dark:bg-slate-950/20",
    description: "Legal help, crime victim services, reentry support, juvenile justice, and record expungement",
    services: [
      { name: "Community Resource Directory — Legal Aid", description: "Free legal services, expungement help, and justice reform organizations", internalLink: "/resource-directory", platform: "Collaborative Advocate" },
      { name: "SafeReport", description: "Incident reporting and compliance — 7-stage lifecycle, 50-state regulation database", internalLink: "/ecosystem", platform: "SafeReport" },
      { name: "Justice Partners Hub", description: "Reentry resources, criminal justice reform, and community partnerships", internalLink: "/justice-partners", platform: "ThriveUp Hub" },
      { name: "Texas RioGrande Legal Aid", description: "Free civil legal services for low-income Texans", externalLink: "https://www.trla.org/" },
      { name: "Lone Star Legal Aid", description: "Free legal help in Texas and Arkansas for those who can't afford an attorney", externalLink: "https://lonestarlegal.blog/" },
      { name: "Texas Crime Victims Resources", description: "Victim services, compensation, and advocacy", externalLink: "https://www.texasattorneygeneral.gov/crime-victims" },
    ],
  },
  {
    id: "refugee", label: "Refugee & Immigration", icon: Globe, color: "text-cyan-600", bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    description: "Refugee resettlement, immigration services, language access, and mixed-status family support",
    services: [
      { name: "LexiBridge (Speech Bridge)", description: "Translation and communication accessibility services", internalLink: "/ecosystem", platform: "LexiBridge" },
      { name: "USCIS Resources", description: "Official U.S. Citizenship and Immigration Services — forms, case status, and info", externalLink: "https://www.uscis.gov" },
      { name: "RAICES Texas", description: "Refugee and Immigrant Center for Education and Legal Services", externalLink: "https://www.raicestexas.org/" },
      { name: "Catholic Charities Immigration", description: "Immigration legal services, refugee resettlement, and family support", externalLink: "https://www.catholiccharitiesusa.org/our-vision-and-ministry/immigration-refugee-services/" },
      { name: "Mixed-Status Family Benefits", description: "Citizen children in mixed-status families qualify for benefits — we screen without asking parent status", internalLink: "/benefits-screener", platform: "Benefits Intel" },
    ],
  },
];

export default function GetHelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredCategories = searchQuery.trim()
    ? SERVICE_CATEGORIES.filter(cat =>
        cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.services.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : SERVICE_CATEGORIES;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-green-50/20 dark:from-blue-950/20 dark:via-background dark:to-green-950/10" data-testid="get-help-page">

      <div className="bg-red-600 text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4 flex-wrap justify-center text-sm">
          <span className="font-bold flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Crisis?</span>
          {CRISIS_LINES.slice(0, 4).map(line => (
            <a key={line.label} href={`tel:${line.number.replace(/[^0-9]/g, '')}`}
              className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-0.5 hover:bg-white/30 transition-colors"
              data-testid={`link-crisis-${line.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <PhoneCall className="h-3 w-3" /> {line.label}: <strong>{line.number}</strong>
            </a>
          ))}
          <span className="text-xs text-red-100 w-full text-center md:w-auto" data-testid="text-numbers-verified">
            Crisis numbers verified as of August 2026
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-page-title">
            Get Help Now
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Find the services you need — benefits, housing, food, healthcare, employment, and more.
            No login required. No judgment. Real help, real resources.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Powered by <strong>The Collaborative Advocate Foundation (TCAF)</strong> · HHSC Community Partner Program
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-blue-600 text-white border-0 hover:bg-blue-700 transition-colors">
            <a href="https://www.yourtexasbenefits.com" target="_blank" rel="noopener noreferrer" className="block" data-testid="link-ytb">
              <CardContent className="pt-6 pb-4 text-center">
                <Shield className="h-10 w-10 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Apply for Texas Benefits</h2>
                <p className="text-sm text-blue-100 mt-1">SNAP, Medicaid, TANF, CHIP — apply at YourTexasBenefits.com</p>
                <Badge className="mt-3 bg-white text-blue-700">YourTexasBenefits.com <ExternalLink className="h-3 w-3 ml-1" /></Badge>
              </CardContent>
            </a>
          </Card>

          <Card className="bg-green-600 text-white border-0 hover:bg-green-700 transition-colors">
            <Link href="/benefits-screener" className="block" data-testid="link-screener">
              <CardContent className="pt-6 pb-4 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Check What You Qualify For</h2>
                <p className="text-sm text-green-100 mt-1">Screen for 9 programs in minutes — SNAP, Medicaid, CHIP, EITC, WIC & more</p>
                <Badge className="mt-3 bg-white text-green-700">Benefits Screener <ArrowRight className="h-3 w-3 ml-1" /></Badge>
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-purple-600 text-white border-0 hover:bg-purple-700 transition-colors">
            <a href="tel:211" className="block" data-testid="link-211">
              <CardContent className="pt-6 pb-4 text-center">
                <Phone className="h-10 w-10 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Call 2-1-1</h2>
                <p className="text-sm text-purple-100 mt-1">Talk to a person — connect to food, housing, health, and social services</p>
                <Badge className="mt-3 bg-white text-purple-700">Available 24/7 <PhoneCall className="h-3 w-3 ml-1" /></Badge>
              </CardContent>
            </a>
          </Card>
        </div>

        <div className="mb-6">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search for help — housing, food, jobs, healthcare, veterans..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg" data-testid="input-search-help" />
          </div>
        </div>

        <div className="space-y-3">
          {filteredCategories.map(cat => {
            const Icon = cat.icon;
            const isExpanded = expandedCategory === cat.id;
            return (
              <Card key={cat.id} className={`transition-all ${isExpanded ? "ring-2 ring-primary/20 shadow-lg" : "hover:shadow-md"}`}
                data-testid={`card-category-${cat.id}`}>
                <button className="w-full text-left" onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  data-testid={`button-category-${cat.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${cat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${cat.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{cat.label}</CardTitle>
                        <CardDescription className="text-xs">{cat.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">{cat.services.length} resources</Badge>
                        <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {cat.services.map((service, i) => (
                        <div key={i} className="group">
                          {service.internalLink ? (
                            <Link href={service.internalLink}>
                              <div className="p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                                data-testid={`link-service-${service.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                <div className="flex items-start gap-2">
                                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">{service.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                                    {service.platform && (
                                      <Badge variant="outline" className="mt-1 text-xs">{service.platform}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ) : service.externalLink ? (
                            <a href={service.externalLink} target="_blank" rel="noopener noreferrer">
                              <div className="p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                                data-testid={`link-service-${service.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                <div className="flex items-start gap-2">
                                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">{service.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {searchQuery && filteredCategories.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-medium">No exact match found</p>
              <p className="text-sm text-muted-foreground mt-1">Try different words, or call 2-1-1 to speak with someone who can help.</p>
              <div className="flex gap-3 justify-center mt-4">
                <Button variant="outline" onClick={() => setSearchQuery("")} data-testid="button-clear-search">Clear Search</Button>
                <Button asChild><a href="tel:211">Call 2-1-1</a></Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 border-2 border-blue-200 dark:border-blue-800" data-testid="card-cpp-infrastructure">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">HHSC Community Partner Infrastructure</CardTitle>
                <CardDescription className="text-xs">TCAF is a certified HHSC Community Partner — trained navigators, physical sites, and digital tools</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <a href="https://www.texascommunitypartnerprogram.com/TCPP_Site_PartnerResources?lang=" target="_blank" rel="noopener noreferrer"
                className="block" data-testid="link-cpp-resources">
                <div className="p-3 rounded-lg border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">TCPP Partner Resources</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Navigator training, HHSC tools, and partner support materials</p>
                      <Badge variant="outline" className="mt-1 text-xs">texascommunitypartnerprogram.com <ExternalLink className="h-3 w-3 ml-1" /></Badge>
                    </div>
                  </div>
                </div>
              </a>
              <a href="https://library.pflugervilletx.gov/269/Library" target="_blank" rel="noopener noreferrer"
                className="block" data-testid="link-pflugerville-library">
                <div className="p-3 rounded-lg border hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-all">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Pflugerville Public Library</p>
                      <p className="text-xs text-muted-foreground mt-0.5">In-person enrollment site — benefits screening, application help, and navigator access</p>
                      <Badge variant="outline" className="mt-1 text-xs">Pflugerville, TX <ExternalLink className="h-3 w-3 ml-1" /></Badge>
                    </div>
                  </div>
                </div>
              </a>
              <a href="https://www.yourtexasbenefits.com/Learn/Home" target="_blank" rel="noopener noreferrer"
                className="block" data-testid="link-ytb-learn">
                <div className="p-3 rounded-lg border hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all">
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">YourTexasBenefits Learn</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Help clients understand what programs exist and how to apply</p>
                      <Badge variant="outline" className="mt-1 text-xs">yourtexasbenefits.com <ExternalLink className="h-3 w-3 ml-1" /></Badge>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 border-2 border-purple-200 dark:border-purple-800" data-testid="card-travis-coalition">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <HandHeart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Travis County Reentry Coalition Resources</CardTitle>
                <CardDescription className="text-xs">For people leaving incarceration or supporting someone who is — partner-vetted pathways</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <a href="https://www.reentryroundtable.org/get-help/" target="_blank" rel="noopener noreferrer"
                className="block" data-testid="link-reentry-roundtable">
                <div className="p-3 rounded-lg border hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all h-full">
                  <div className="flex items-start gap-2">
                    <HandHeart className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Reentry Roundtable — Get Help</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Travis County coalition portal — housing, jobs, ID, food, healthcare, behavioral health</p>
                      <Badge variant="outline" className="mt-1 text-xs">reentryroundtable.org <ExternalLink className="h-3 w-3 ml-1" /></Badge>
                    </div>
                  </div>
                </div>
              </a>
              <a href="https://www.tdcj.texas.gov/divisions/rrd/index.html" target="_blank" rel="noopener noreferrer"
                className="block" data-testid="link-tdcj-rrd">
                <div className="p-3 rounded-lg border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all h-full">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">TDCJ Reentry & Rehabilitation</p>
                      <p className="text-xs text-muted-foreground mt-0.5">State programs — Project RIO, IPTC, CHANGES, PAMIO, Faith-Based</p>
                      <Badge variant="outline" className="mt-1 text-xs">tdcj.texas.gov/divisions/rrd <ExternalLink className="h-3 w-3 ml-1" /></Badge>
                    </div>
                  </div>
                </div>
              </a>
              <a href="https://beaconconnections.org" target="_blank" rel="noopener noreferrer"
                className="block" data-testid="link-beacon-connections">
                <div className="p-3 rounded-lg border hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all h-full">
                  <div className="flex items-start gap-2">
                    <GraduationCap className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Beacon Connections (Training)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">CBT, MI, and reentry-skills facilitator training for staff and partners</p>
                      <Badge variant="outline" className="mt-1 text-xs">beaconconnections.org <ExternalLink className="h-3 w-3 ml-1" /></Badge>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/20 dark:to-blue-950/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-bold text-sm">Available 24/7</h3>
                <p className="text-xs text-muted-foreground">Our online resources are always accessible. Call 2-1-1 anytime.</p>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-bold text-sm">No Login Required</h3>
                <p className="text-xs text-muted-foreground">Access help without creating an account. Your privacy matters.</p>
              </div>
              <div className="text-center">
                <Globe className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-bold text-sm">Serving All of Texas</h3>
                <p className="text-xs text-muted-foreground">HHSC Community Partner Program — connecting Texans to benefits statewide.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
          <p>The Collaborative Advocate Foundation (TCAF) · 501(c)(3) · EIN 41-3618003</p>
          <p>HHSC Community Partner Program · thrivingcommunitiesforall.com</p>
          <p>Dr. Terry Flood, Founder · US Army Veteran (17 years) · president@thecollaborativeadvocate.org · 254-319-8460</p>
        </div>

        <DFCCrossNav currentPage="get-help" />
      </div>
    </div>
  );
}
