import { useEffect, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ArrowRight, Shield, Target,
  Sparkles, MapPin, Search,
  Briefcase, BarChart3, DollarSign, CheckCircle2,
  BookOpen, GraduationCap, Building2, Factory, School,
  HandshakeIcon, Quote, Award, TrendingUp,
  Wrench, ChevronDown, Mail, Calendar,
  Map, Microscope, Layers,
  Globe, ExternalLink, Brain, Stethoscope, Baby, User,
  Siren, Eye, Pill, MessageSquare, Activity,
  Video, Megaphone, Network, Cpu
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";

const PATHWAYS = [
  {
    id: "help",
    icon: Heart,
    title: "I need to know what my family qualifies for",
    subtitle: "Benefits, food, housing, healthcare, jobs",
    description: "You may be eligible for programs you don't know about yet. We screen 9 programs at once — one conversation, not nine offices. You decide what to pursue.",
    action: "See What I Qualify For",
    href: "/benefits-screener",
    color: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50 dark:bg-rose-950/20",
    borderColor: "border-rose-200 dark:border-rose-800",
    urgency: "5 minutes. Free. Confidential.",
  },
  {
    id: "data",
    icon: BarChart3,
    title: "Show me what's really happening in my community",
    subtitle: "The data behind the headlines",
    description: "County averages hide the truth. We show you neighborhood-by-neighborhood data — poverty, access barriers, health gaps — for any community in the country. Every number verifiable.",
    action: "See My Community's Data",
    href: "/sdoh-explorer",
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    urgency: "Live Census data. Any U.S. neighborhood.",
  },
  {
    id: "evaluate",
    icon: Search,
    title: "I'm considering funding or supporting this work",
    subtitle: "Funder, reviewer, evaluator, or prospective partner",
    description: "We built this in the open so you can see exactly how it works. Impact data, methodology, outcome tracking — nothing behind a login wall. Judge us by the evidence.",
    action: "See the Evidence",
    href: "/ecosystem-story",
    color: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50 dark:bg-violet-950/20",
    borderColor: "border-violet-200 dark:border-violet-800",
    urgency: "Transparent. Verifiable. Open science.",
  },
  {
    id: "partner",
    icon: HandshakeIcon,
    title: "My organization wants to do more for our community",
    subtitle: "Church, nonprofit, employer, school, or agency",
    description: "You're already doing the work. We give you the infrastructure to multiply it — shared referrals, coordinated services, outcome tracking, and the data to prove to funders what your community already knows.",
    action: "See How We Work Together",
    href: "/coalition",
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    urgency: "Join organizations already in the network.",
  },
  {
    id: "learn",
    icon: GraduationCap,
    title: "I want to build new skills",
    subtitle: "AI literacy, career training, digital skills — all ages",
    description: "Free courses in AI, digital literacy, and career readiness. Go at your own pace. Whether you're 14 or 64, there's a pathway here that meets you where you are.",
    action: "Start Learning — It's Free",
    href: "/curriculum",
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    urgency: "Self-paced. No prerequisites.",
  },
];

function PathwayCard({ pathway }: { pathway: typeof PATHWAYS[0] }) {
  return (
    <Link
      href={pathway.href}
      className={`group relative block overflow-hidden rounded-xl border-2 ${pathway.borderColor} ${pathway.bgLight} bg-card transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] no-underline`}
      data-testid={`card-pathway-${pathway.id}`}
      aria-label={`${pathway.title} — ${pathway.action}`}
    >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className={`rounded-xl p-3 bg-gradient-to-br ${pathway.color} shrink-0 shadow-md`}>
              <pathway.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-0.5" data-testid={`text-pathway-title-${pathway.id}`}>
                {pathway.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3" data-testid={`text-pathway-desc-${pathway.id}`}>{pathway.description}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r ${pathway.color} text-white text-sm font-medium shadow-sm`} data-testid={`button-pathway-${pathway.id}`}>
                  {pathway.action}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-xs text-muted-foreground italic" data-testid={`text-pathway-urgency-${pathway.id}`}>{pathway.urgency}</span>
              </div>
            </div>
          </div>
        </div>
    </Link>
  );
}

function TrustBar() {
  return (
    <section className="py-8 px-4 sm:py-10 sm:px-6 bg-gradient-to-b from-card to-background border-y" data-testid="section-trust-bar">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-5">
          <Badge variant="secondary" className="mb-3" data-testid="badge-trust-eyebrow">
            <Shield className="mr-1 h-3 w-3" /> IRS-Determined 501(c)(3) Public Charity
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold mb-2" data-testid="text-trust-heading">
            The Collaborative Advocate Foundation
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-2" data-testid="text-trust-summary">
            A veteran-founded, Black-led 501(c)(3) public charity headquartered in Pflugerville, Texas. Led by Dr. Terry Flood, DHA/DBA, President.
            Contributions are <strong>tax-deductible</strong> under IRS §170 to the fullest extent of the law.
          </p>
          <p className="text-xs text-muted-foreground/70 max-w-2xl mx-auto">
            IRS Determination Letter 947 · Effective January 14, 2026 · Public charity under §170(b)(1)(A)(vi) · Form 990 series filer · Fiscal year ends December 31.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto" data-testid="grid-trust-credentials">
          <div className="rounded-md border bg-card px-3 py-2.5 text-center" data-testid="credential-ein">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">EIN</p>
            <p className="text-sm font-mono font-semibold">41-3618003</p>
          </div>
          <div className="rounded-md border bg-card px-3 py-2.5 text-center" data-testid="credential-uei">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">SAM.gov UEI</p>
            <p className="text-sm font-mono font-semibold">KDDVD1FGLW35</p>
          </div>
          <div className="rounded-md border bg-card px-3 py-2.5 text-center" data-testid="credential-cage">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">CAGE Code</p>
            <p className="text-sm font-mono font-semibold">209N1</p>
          </div>
          <div className="rounded-md border bg-card px-3 py-2.5 text-center" data-testid="credential-sam-status">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">SAM.gov Status</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Active</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-501c3">
            <Shield className="mr-1 h-3 w-3" /> 501(c)(3) Determined
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-deductible">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Tax-Deductible
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-vosb">
            <Shield className="mr-1 h-3 w-3" /> Veteran-Founded
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-sam-active">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Federal Award Eligible
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-wcag">
            <Shield className="mr-1 h-3 w-3" /> WCAG 2.1 AA
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-coppa">
            <Shield className="mr-1 h-3 w-3" /> COPPA Compliant
          </Badge>
        </div>

        <p className="text-[11px] text-center text-muted-foreground/60 mt-4 max-w-2xl mx-auto">
          Verify our status directly: search EIN 41-3618003 on the{" "}
          <a
            href="https://apps.irs.gov/app/eos/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
            data-testid="link-irs-eos"
          >
            IRS Tax Exempt Organization Search
          </a>
          {" "}· UEI KDDVD1FGLW35 on{" "}
          <a
            href="https://sam.gov/entity-information"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
            data-testid="link-sam-gov"
          >
            SAM.gov
          </a>.
        </p>
      </div>
    </section>
  );
}

function ImpactNumbers() {
  return (
    <section className="py-10 px-4 bg-card" data-testid="section-impact-numbers">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: "15", label: "Ecosystem Platforms" },
            { value: "651", label: "Grants Tracked" },
            { value: "4", label: "AI Engines" },
            { value: "107", label: "Languages Supported" },
          ].map((stat) => (
            <div key={stat.label} className="py-2" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <p className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommunitiesWeServe() {
  const populations = [
    {
      icon: GraduationCap, title: "CTE Students (Grades 9-12)",
      desc: "Empowered with workforce readiness training aligned to all 20 TEKS §127.15 standards, verifiable digital credentials, and career pathways in healthcare, skilled trades, IT, and business — so they graduate ready to lead.",
      location: "Pflugerville ISD, Manor ISD, Austin ISD",
    },
    {
      icon: Briefcase, title: "Out-of-School Youth (16-24)",
      desc: "Equipped with GED pathways, AI-powered career exploration, and employer connections — giving young adults who were written off the tools to write their own story.",
      location: "Austin metro area",
    },
    {
      icon: Shield, title: "Returning Citizens & Justice-Involved",
      desc: "Empowered to rebuild — with credential recovery, fair-chance employer partnerships, housing navigation, and 365-day retention tracking that proves they belong in the workforce.",
      location: "Travis County & surrounding counties",
    },
    {
      icon: Award, title: "Veterans & Military Families",
      desc: "Equipped to translate military discipline into civilian careers — with skills mapping, benefits navigation, peer mentorship, and employer connections that honor their service.",
      location: "Central Texas",
    },
    {
      icon: Heart, title: "Families Navigating Barriers",
      desc: "Empowered to access what they're entitled to — benefits screening across 9 programs in one conversation, plus housing, food, and wraparound support so they can focus on what's next.",
      location: "Any U.S. community",
    },
    {
      icon: Building2, title: "Community & Faith-Based Organizations",
      desc: "Equipped with the infrastructure to run real workforce programs — track who you reach, coordinate referrals, report outcomes to funders, and prove the impact your community already knows you're making.",
      location: "Pflugerville, Manor, East Austin",
    },
  ];

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6" data-testid="section-communities-we-serve">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            <MapPin className="mr-1 h-3 w-3" /> Central Texas &amp; Beyond
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-communities-heading">Who We Empower</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            We take a holistic approach — seeing the whole person, not just one problem. We're agnostic about where solutions come from and agile enough to adapt when communities tell us what they actually need. The result: infrastructure built through intentional collaboration, not assumptions.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {populations.map((p) => (
            <Card key={p.title} className="p-5 flex flex-col" data-testid={`card-population-${p.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-md bg-primary/10 p-2 shrink-0">
                  <p.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{p.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-3">{p.desc}</p>
              <div className="flex items-center gap-1.5 text-xs text-primary/70">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{p.location}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatWeDeliver() {
  const programs = [
    {
      icon: GraduationCap, title: "ThriveUp Workforce Readiness Certificate",
      desc: "15-week AI-powered curriculum covering professional presence, workplace rights, safety (OSHA), time management, and work ethic. Mapped to all 20 TEKS §127.15 CTE standards. Completers earn a verifiable digital credential they own forever.",
    },
    {
      icon: Building2, title: "Community Empowerment Infrastructure",
      desc: "We don't parachute in and leave. We equip churches, nonprofits, schools, and local organizations with the tools to run their own programs, track their own outcomes, and sustain their own impact. Platform-agnostic. Community-led. Built to last beyond any single grant.",
    },
    {
      icon: BarChart3, title: "Transparent Outcome Accountability",
      desc: "Employment at 30/90/180/365 days, credential attainment, recidivism reduction, wage gains, and housing stability — all transparent, all verifiable. Communities see their own data. Funders see proof.",
    },
    {
      icon: Sparkles, title: "AI That Works for the Community",
      desc: "Four AI engines that personalize learning paths, screen for benefits, map community needs, and evaluate what's working — putting the power of data science in the hands of the people it's supposed to help.",
    },
  ];

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6 bg-card" data-testid="section-what-we-deliver">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-deliver-heading">What We Actually Build</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Not promises — infrastructure. Not handouts — credentials. Not rigid programs — agile systems that adapt to each community. We build through intentional collaboration and transparent communication, so every stakeholder sees the same truth.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {programs.map((pr) => (
            <Card key={pr.title} className="p-5" data-testid={`card-deliver-${pr.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-start gap-3 mb-2">
                <div className="rounded-md bg-primary/10 p-2 shrink-0">
                  <pr.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{pr.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{pr.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function SuccessStories() {
  const stories = [
    { name: "Marcus Williams", role: "Returning Citizen", pathway: "Skilled Trades", quote: "After 8 years inside, I had no idea where to start. The case manager connected me to a welding program, and the AI navigator helped me find housing and transportation. Six months later, I am employed full-time with benefits. My kids can see a different future now." },
    { name: "Maria Santos", role: "Career Changer", pathway: "Technology", quote: "I was a single mom working two part-time jobs with no path forward. The workforce assessment showed me I had skills I did not even realize. The AI curriculum taught me to use technology professionally, and the employer partner hired me at a livable wage. Everything changed." },
    { name: "Pastor David Chen", role: "Community Partner", pathway: "Faith-Based Org", quote: "Our church wanted to do more than food drives. This platform gave us the tools to run a real workforce program — tracking who we serve, what services we provide, and showing the results to funders. We went from helping a few families to transforming our neighborhood." },
  ];

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6 bg-card" data-testid="section-success-stories">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            <Award className="mr-1 h-3 w-3" /> Real People, Real Outcomes
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-success-heading">Success Stories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stories.map((story, idx) => (
            <Card key={idx} className="p-5 flex flex-col" data-testid={`card-testimonial-${idx}`}>
              <Quote className="h-5 w-5 text-primary/30 mb-2 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic" data-testid={`text-testimonial-quote-${idx}`}>
                "{story.quote}"
              </p>
              <div className="mt-3 pt-3 border-t">
                <p className="font-semibold text-sm" data-testid={`text-testimonial-name-${idx}`}>{story.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{story.role}</span>
                  <Badge variant="outline" className="text-xs">{story.pathway}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6" data-testid="section-how-it-works">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-how-heading">Three Steps to Impact</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">A holistic path — from discovering what you're entitled to, through earning credentials, to owning your future. At every step, you lead. We build alongside you.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: 1, title: "Discover & Unlock", desc: "Find out what you qualify for — 9+ benefit programs screened in one conversation. Then choose your path: workforce training, education, career exploration, or the support you need to get stable first.", icon: Search },
            { step: 2, title: "Learn & Earn Your Credential", desc: "AI-powered workforce readiness curriculum — 15 weeks, self-paced, aligned to Texas CTE standards. You earn a verifiable digital credential that's yours to keep and share with employers.", icon: Target },
            { step: 3, title: "Launch & Own Your Future", desc: "Employer matching, interview prep, and placement support. Outcomes tracked at 30, 90, 180, and 365 days — not to check on you, but to prove what you've built.", icon: BarChart3 },
          ].map((item) => (
            <Card key={item.step} className="p-5 text-center" data-testid={`card-step-${item.step}`}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-primary">{item.step}</span>
              </div>
              <item.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1" data-testid={`text-step-title-${item.step}`}>{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const ECOSYSTEM_PLATFORMS_DATA = [
  {
    domain: "Health Equity & Wellness",
    color: "from-rose-500 to-pink-600",
    platforms: [
      { name: "Whole-Person Health Ecosystem", url: "https://mentalwellnesssupport.net", desc: "Clinical screenings (C-SSRS, PHQ-9, GAD-7, PCL-5), safety plans, crisis tools, 20,670+ resources across 2,091 community groups", icon: Heart },
      { name: "Sankofa Health Network", url: "https://yourhealthbirthright.net", desc: "Health equity gateway orchestrating 5 sub-platforms for culturally responsive behavioral health in Black communities", icon: Stethoscope },
      { name: "Holistic Black Feminine Health Hub", url: "https://yourfeminineneeds.com", desc: "Reproductive health, preventive screening, hormonal wellness, cervical/breast cancer awareness, culturally responsive provider matching", icon: Heart },
      { name: "Black Maternal Health Network", url: "https://yourhealthbirthright.net", desc: "Prenatal/postnatal care navigation, certified doula matching, maternal mental health screening — addressing the 3x mortality gap", icon: Baby },
      { name: "Black Men's Health Hub", url: "https://thehealthyblkman.com", desc: "Prostate cancer screening, cardiovascular risk assessment, mental health stigma reduction, peer mentoring for Black men", icon: User },
      { name: "SafeCogniCare", url: "https://safecognicare.com", desc: "TBI, ADHD, dementia, and peripartum cognitive assessments (MoCA, MMSE), safety protocols, care coordination", icon: Brain },
    ],
  },
  {
    domain: "Education & Youth",
    color: "from-amber-500 to-orange-600",
    platforms: [
      { name: "ISSS — Integrated Supports for Thriving Youth", url: "https://implementationineducatio.com", desc: "MTSS engine with Thrive Scores, early warning indicators, multi-stakeholder coordination for student support at scale", icon: School },
      { name: "Perfectly Different", url: "https://neurodifferentassistant.app", desc: "Neurodiversity-affirming support for autism, ADHD, AuDHD — IEP/504 plan builder, executive function coaching, sensory tools", icon: Sparkles },
      { name: "Better Science Lab / RPLICE", url: "https://bettersciencelab.com", desc: "Implementation science engine — CFIR, RE-AIM, EPIS frameworks, evidence-based practice registry, research translation tools", icon: Microscope },
    ],
  },
  {
    domain: "Veterans & Workforce",
    color: "from-blue-500 to-indigo-600",
    platforms: [
      { name: "Mission Transition (M2C)", url: "https://vetmissiontransition.com", desc: "Military-to-civilian transition — MOS translation, benefits navigation, identity support, targeting the first 12-month risk window", icon: Shield },
      { name: "Minority Center of Excellence", url: "https://minoritycenterofexcellence.com", desc: "656,794 SAM.gov records, 14 AI tools, dual-AI proposal review, certification wizard for 8(a)/HUBZone/WOSB/SDVOSB", icon: Building2 },
    ],
  },
  {
    domain: "Safety & Compliance",
    color: "from-emerald-500 to-teal-600",
    platforms: [
      { name: "SafeReport", url: "https://safereports.net", desc: "50-state mandatory reporter system — 7-stage incident lifecycle, tamper-evident audit trails, court-admissible evidence packaging", icon: Shield },
      { name: "Talk Your Talk", url: "https://talkyourtalk.net", desc: "Dialect- and sign-aware communication — 89 spoken languages, 18 sign languages, real-time speech-to-text, culturally responsive translation", icon: MessageSquare },
    ],
  },
  {
    domain: "Community & Resources",
    color: "from-violet-500 to-purple-600",
    platforms: [
      { name: "LifeBridge", url: "https://lifetransitionsaid.org", desc: "Virtual 211 — 24/7 resource navigation for housing, food, healthcare, crisis support, 20,670+ resources, life event guides", icon: Heart },
      { name: "ThriveUp Academy", url: "https://thriveupacademy.com", desc: "The anchor platform — AI-powered workforce readiness curriculum, career pathways, 4-engine AI, community infrastructure", icon: GraduationCap },
    ],
  },
];

function EcosystemPlatformsSection() {
  const [expanded, setExpanded] = useState(false);
  const totalPlatforms = ECOSYSTEM_PLATFORMS_DATA.reduce((sum, d) => sum + d.platforms.length, 0);

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6" data-testid="section-ecosystem-platforms">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            <Globe className="mr-1 h-3 w-3" /> {totalPlatforms} Live Platforms
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-ecosystem-heading">
            Our Ecosystem — Live & Connected
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Every platform is live, branded, and purpose-built. Click any link to see it yourself. This is not a roadmap — this is what's running right now.
          </p>
        </div>

        <div className="text-center mb-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setExpanded(!expanded)}
            data-testid="button-show-platforms"
          >
            {expanded ? "Collapse Platforms" : `See All ${totalPlatforms} Platforms`}
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {expanded && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {ECOSYSTEM_PLATFORMS_DATA.map((domain) => (
              <div key={domain.domain}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${domain.color}`} />
                  <h3 className="font-bold text-lg" data-testid={`text-domain-${domain.domain.toLowerCase().replace(/\s+/g, '-')}`}>
                    {domain.domain}
                  </h3>
                  <Badge variant="outline" className="text-xs">{domain.platforms.length}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {domain.platforms.map((platform) => (
                    <a
                      key={platform.name}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                      data-testid={`card-platform-${platform.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Card className="p-4 h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:scale-[1.01]">
                        <div className="flex items-start gap-3 mb-2">
                          <div className={`rounded-md p-2 bg-gradient-to-br ${domain.color} shrink-0`}>
                            <platform.icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                              {platform.name}
                            </h4>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                          {platform.desc}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-primary/70 group-hover:text-primary transition-colors">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{platform.url.replace("https://", "")}</span>
                        </div>
                      </Card>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DeepDiveSection() {
  const [showMore, setShowMore] = useState(false);

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6 bg-card" data-testid="section-deep-dive">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowMore(!showMore)}
            aria-expanded={showMore}
            aria-controls="deep-dive-panel"
            data-testid="button-deep-dive-toggle"
          >
            {showMore ? "Show Less" : "Want to Go Deeper? See the Full Platform"}
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {showMore && (
          <div id="deep-dive-panel" role="region" aria-label="Full platform details" className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="text-center">
              <Badge variant="secondary" className="mb-3">
                <Layers className="mr-1 h-3 w-3" /> The Full Ecosystem
              </Badge>
              <h2 className="text-2xl font-bold mb-2">15 Service Platforms, One Living System</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Holistic by design. Agile by necessity. Agnostic by principle. We build through intentional collaboration, transparent communication, and the conviction that every community already has what it takes — they just need the infrastructure to prove it.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-center mb-4" data-testid="text-domains-heading">Six Domains, One Ecosystem</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: Shield, title: "Criminal Justice", desc: "Reentry, reintegration, family reunification, diversion, recidivism reduction." },
                  { icon: Heart, title: "Health Equity", desc: "Maternal health, chronic disease, medication management, cognitive safety, SDOH navigation." },
                  { icon: Sparkles, title: "Behavioral Health", desc: "Mental health screening, crisis intervention, safety planning, substance use, 988 integration." },
                  { icon: Briefcase, title: "Workforce & Business", desc: "Career pathways, apprenticeships, small business support, procurement, employer partnerships." },
                  { icon: GraduationCap, title: "Education & Learning", desc: "Pre-K through graduate and professional development, STEM, digital literacy, neurodiversity." },
                  { icon: HandshakeIcon, title: "Community & Advocacy", desc: "Housing, food access, utilities, emergency management, civic engagement, faith-based coordination." },
                ].map((d) => (
                  <Card key={d.title} className="p-4" data-testid={`card-domain-${d.title.toLowerCase().replace(/\s/g, '-')}`}>
                    <div className="flex items-start gap-2">
                      <div className="rounded-md bg-primary/10 p-1.5 shrink-0">
                        <d.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-0.5">{d.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-center mb-4" data-testid="text-ai-heading">4-Engine AI Architecture</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Map, title: "Community Intelligence Engine", desc: "Maps needs, assets, and service gaps across zip codes. Live Census, CDC, and FBI data integration." },
                  { icon: Target, title: "Personal Navigation Engine", desc: "AI-powered case management that sees the whole person — not just one presenting need." },
                  { icon: Microscope, title: "Implementation Science Engine", desc: "Evaluates program effectiveness using CFIR 2.0 + RE-AIM frameworks via the RPLICE instrument." },
                  { icon: TrendingUp, title: "Predictive Analytics Engine", desc: "Identifies emerging community needs before they become crises. Pattern detection across all six domains." },
                ].map((e) => (
                  <Card key={e.title} className="p-4" data-testid={`card-engine-${e.title.toLowerCase().replace(/\s/g, '-')}`}>
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-2 shrink-0">
                        <e.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-0.5">{e.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{e.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { icon: Search, title: "Grant Discovery Engine", desc: "AI-powered alignment scoring matching capabilities to federal, state, and private funding." },
                { icon: Briefcase, title: "Workforce Pipeline", desc: "Complete lifecycle: intake to training, credentials, placement, and 365-day retention tracking." },
                { icon: Shield, title: "Reentry & Case Management", desc: "Evidence-based reentry plans, milestone tracking, and reporting aligned to DOJ/WIOA standards." },
                { icon: Sparkles, title: "AI-Powered Tools", desc: "10 professional-grade tools for presentations, resumes, business plans, and portfolios." },
                { icon: HandshakeIcon, title: "Partner Ecosystem", desc: "Coordinated service delivery across churches, employers, schools, and community organizations." },
                { icon: Microscope, title: "Implementation Science", desc: "CFIR 2.0, RE-AIM, and RPLICE-powered evaluation embedded in every program and proposal." },
              ].map((f) => (
                <Card key={f.title} className="p-4" data-testid={`card-feature-${f.title.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 shrink-0">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-0.5">{f.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/health-network">
                <Button variant="default" data-testid="button-deep-health-network">
                  <Heart className="mr-2 h-4 w-4" /> Health Network
                </Button>
              </Link>
              <Link href="/ecosystem">
                <Button variant="outline" data-testid="button-deep-ecosystem">
                  <Layers className="mr-2 h-4 w-4" /> Full Ecosystem Map
                </Button>
              </Link>
              <Link href="/sdoh-explorer">
                <Button variant="outline" data-testid="button-deep-sdoh">
                  <BarChart3 className="mr-2 h-4 w-4" /> SDOH Explorer
                </Button>
              </Link>
              <Link href="/grants">
                <Button variant="outline" data-testid="button-deep-grants">
                  <Search className="mr-2 h-4 w-4" /> Grant Hub
                </Button>
              </Link>
              <Link href="/rplice-tools">
                <Button variant="outline" data-testid="button-deep-rplice">
                  <Microscope className="mr-2 h-4 w-4" /> Research Tools
                </Button>
              </Link>
            </div>

            <Card className="p-6 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-primary/20 border-2" data-testid="card-mapgap-summary">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg mb-1">How It All Connects: The MAP-GAP Operating System</h3>
                <p className="text-sm text-muted-foreground">Academic Research to Community Impact — transparent, measurable, adaptive.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-medium text-xs">Academic Research</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                <span className="px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 font-medium text-xs">MAP-GAP Translation</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                <span className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-medium text-xs">Platform Technology</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                <span className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium text-xs">Community Impact</span>
              </div>
              <div className="text-center mt-4">
                <Link href="/mapgap-framework">
                  <Button variant="outline" size="sm" data-testid="button-mapgap-learn">
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Learn More About MAP-GAP
                  </Button>
                </Link>
              </div>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Workforce Training", icon: Wrench },
                { label: "Job Placement", icon: Briefcase },
                { label: "Recidivism Reduction", icon: Shield },
                { label: "Career Advancement", icon: TrendingUp },
                { label: "Community Health", icon: Heart },
                { label: "Service Delivery", icon: HandshakeIcon },
              ].map((c) => (
                <Card key={c.label} className="p-3 text-center" data-testid={`card-compliance-${c.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    <c.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  </div>
                  <p className="text-xs font-medium">{c.label}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DisciplineStrip() {
  const disciplines = [
    { icon: Briefcase,     label: "Workforce Training",   href: "/workforce-training" },
    { icon: Shield,        label: "Inmate Reentry",       href: "/reentry-program" },
    { icon: Baby,          label: "Foster Youth",         href: "/foster-youth" },
    { icon: Award,         label: "Veterans",             href: "/veterans" },
    { icon: Stethoscope,   label: "Health Equity",        href: "/sdoh-explorer" },
    { icon: CheckCircle2,  label: "Benefits Navigation",  href: "/benefits-screener" },
    { icon: GraduationCap, label: "Youth Development",    href: "/academy" },
    { icon: Activity,      label: "Community Health",     href: "/health-network" },
  ];
  return (
    <section className="px-4 py-6 sm:px-6 border-b" data-testid="section-discipline-strip">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-4">
          What we do
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {disciplines.map((d) => (
            <Link
              key={d.label}
              href={d.href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-card text-sm font-medium text-foreground hover:bg-primary/5 hover:border-primary/40 transition-colors no-underline"
              data-testid={`chip-discipline-${d.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <d.icon className="h-3.5 w-3.5 text-primary shrink-0" />
              {d.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function StartHere() {
  const audiences = [
    {
      icon: Heart,
      label: "I need help for my family",
      sub: "Benefits · housing · healthcare · jobs",
      href: "/benefits-screener",
      color: "from-rose-500 to-pink-600",
      testId: "start-here-help",
    },
    {
      icon: Briefcase,
      label: "I work with communities",
      sub: "Nonprofits · social workers · CHWs",
      href: "/grants",
      color: "from-violet-500 to-purple-600",
      testId: "start-here-org",
    },
    {
      icon: GraduationCap,
      label: "I want to learn a trade or earn credentials",
      sub: "Youth · workforce · career changers",
      href: "/academy/careers",
      color: "from-amber-500 to-orange-600",
      testId: "start-here-learn",
    },
    {
      icon: Shield,
      label: "I'm a veteran or returning citizen",
      sub: "Transition · reentry · benefits navigation",
      href: "/reentry",
      color: "from-blue-500 to-indigo-600",
      testId: "start-here-veteran",
    },
    {
      icon: Building2,
      label: "I'm a funder or partner considering a relationship",
      sub: "Funders · government · employers",
      href: "/business-plan",
      color: "from-emerald-500 to-teal-600",
      testId: "start-here-funder",
    },
    {
      icon: Target,
      label: "I want to understand the research behind this",
      sub: "Researchers · evaluators · policy leaders",
      href: "/rplice-tools",
      color: "from-cyan-500 to-sky-600",
      testId: "start-here-research",
    },
  ];

  return (
    <section className="py-10 px-4 sm:py-14 sm:px-6 bg-card border-y" data-testid="section-start-here">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <Badge variant="secondary" className="mb-3">
            <ArrowRight className="mr-1 h-3 w-3" /> Start Here
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold mb-1" data-testid="text-start-here-heading">
            Who are you? We'll point you the right direction.
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Every path through ThriveUp is different. Pick the one closest to you.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {audiences.map((a) => (
            <Link key={a.testId} href={a.href}>
              <Card
                className="p-4 hover-elevate cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all group h-full"
                data-testid={`card-${a.testId}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-md bg-gradient-to-br ${a.color} p-2 shrink-0`}>
                    <a.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{a.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.sub}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const HERO_NODES = [
  { label: "Health",   angle: 0,   dist: 320, color: "#34d399" },
  { label: "Housing",  angle: 36,  dist: 350, color: "#60a5fa" },
  { label: "Jobs",     angle: 72,  dist: 300, color: "#a78bfa" },
  { label: "Justice",  angle: 108, dist: 340, color: "#f472b6" },
  { label: "Youth",    angle: 144, dist: 310, color: "#fb923c" },
  { label: "Veterans", angle: 180, dist: 330, color: "#38bdf8" },
  { label: "Families", angle: 216, dist: 300, color: "#34d399" },
  { label: "Faith",    angle: 252, dist: 350, color: "#f59e0b" },
  { label: "CHW",      angle: 288, dist: 315, color: "#c084fc" },
  { label: "Data",     angle: 324, dist: 335, color: "#22d3ee" },
];
const HERO_STREAM_COLORS = ["#22d3ee", "#f59e0b", "#a78bfa", "#34d399", "#f472b6"];

function useIsDark() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function HeroBackground({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    type StreamParticle = { x: number; y: number; speed: number; size: number; color: string; alpha: number; trail: { x: number; y: number }[] };
    const particles: StreamParticle[] = Array.from({ length: 35 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      speed: 0.3 + Math.random() * 0.55,
      size: 1 + Math.random() * 1.4,
      color: HERO_STREAM_COLORS[Math.floor(Math.random() * HERO_STREAM_COLORS.length)],
      alpha: isDark ? (0.35 + Math.random() * 0.3) : (0.22 + Math.random() * 0.28),
      trail: [],
    }));

    const nodes = HERO_NODES.map((n) => ({
      ...n,
      px: cx + Math.cos((n.angle * Math.PI) / 180) * n.dist,
      py: cy + Math.sin((n.angle * Math.PI) / 180) * n.dist,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.018 + Math.random() * 0.012,
    }));

    let tick = 0;
    function draw() {
      tick++;
      ctx!.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; p.trail = []; }
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 9) p.trail.shift();
        if (p.trail.length > 1) {
          ctx!.beginPath(); ctx!.strokeStyle = p.color; ctx!.lineWidth = p.size * 0.6;
          p.trail.forEach((pt, i) => {
            ctx!.globalAlpha = (i / p.trail.length) * p.alpha * 0.45;
            i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y);
          });
          ctx!.stroke();
        }
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = p.color; ctx!.globalAlpha = p.alpha; ctx!.fill();
        ctx!.globalAlpha = 1;
      });

      nodes.forEach((n) => {
        n.pulse += n.pulseSpeed;
        n.px += n.vx; n.py += n.vy;
        const tx = cx + Math.cos((n.angle * Math.PI) / 180) * n.dist;
        const ty = cy + Math.sin((n.angle * Math.PI) / 180) * n.dist;
        n.vx += (tx - n.px) * 0.003; n.vy += (ty - n.py) * 0.003;
        n.vx *= 0.97; n.vy *= 0.97;

        const dc = Math.sqrt((n.px - cx) ** 2 + (n.py - cy) ** 2);
        const lineBase = isDark ? 0.38 : 0.28;
        const la = lineBase * (1 - dc / 430);
        if (la > 0) {
          const gr = ctx!.createLinearGradient(cx, cy, n.px, n.py);
          gr.addColorStop(0, n.color + "00");
          gr.addColorStop(0.55, n.color + Math.round(la * 255).toString(16).padStart(2, "0"));
          gr.addColorStop(1, n.color + Math.round(Math.min(la * 1.5, 1) * 255).toString(16).padStart(2, "0"));
          ctx!.beginPath(); ctx!.strokeStyle = gr; ctx!.lineWidth = isDark ? 0.9 : 1.1;
          ctx!.moveTo(cx, cy); ctx!.lineTo(n.px, n.py); ctx!.stroke();
          const prog = ((tick * 0.005 + n.angle * 0.01) % 1);
          ctx!.beginPath(); ctx!.arc(cx + (n.px - cx) * prog, cy + (n.py - cy) * prog, 1.5, 0, Math.PI * 2);
          ctx!.fillStyle = n.color; ctx!.globalAlpha = isDark ? 0.45 : 0.65; ctx!.fill(); ctx!.globalAlpha = 1;
        }

        const pf = 1 + Math.sin(n.pulse) * 0.11;
        const r = 4.5 * pf;
        const gw = ctx!.createRadialGradient(n.px, n.py, 0, n.px, n.py, r * 3.5);
        gw.addColorStop(0, n.color + (isDark ? "44" : "55")); gw.addColorStop(1, n.color + "00");
        ctx!.beginPath(); ctx!.arc(n.px, n.py, r * 3.5, 0, Math.PI * 2); ctx!.fillStyle = gw; ctx!.fill();
        ctx!.beginPath(); ctx!.arc(n.px, n.py, r, 0, Math.PI * 2); ctx!.fillStyle = n.color; ctx!.fill();
        ctx!.font = "9px Inter, system-ui, sans-serif"; ctx!.fillStyle = n.color;
        ctx!.globalAlpha = isDark ? 0.65 : 0.8; ctx!.textAlign = "center";
        ctx!.fillText(n.label, n.px, n.py + r + 12); ctx!.globalAlpha = 1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.sqrt((a.px - b.px) ** 2 + (a.py - b.py) ** 2);
          if (d < 175) {
            ctx!.beginPath(); ctx!.strokeStyle = a.color;
            ctx!.globalAlpha = (1 - d / 175) * (isDark ? 0.07 : 0.13); ctx!.lineWidth = 0.6;
            ctx!.moveTo(a.px, a.py); ctx!.lineTo(b.px, b.py); ctx!.stroke(); ctx!.globalAlpha = 1;
          }
        }
      }
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isDark]);

  useEffect(() => {
    let tick = 0;
    const iv = setInterval(() => {
      tick += 0.005;
      if (!blobRef.current) return;
      blobRef.current.querySelectorAll<HTMLElement>("[data-hb]").forEach((b, i) => {
        const ph = tick + i * 1.4;
        b.style.transform = `translate(${Math.sin(ph * 0.5) * 28}px,${Math.cos(ph * 0.4) * 22}px) scale(${1 + Math.sin(ph * 0.7) * 0.07})`;
      });
    }, 16);
    return () => clearInterval(iv);
  }, []);

  if (isDark) {
    return (
      <>
        <div className="absolute inset-0" style={{ background: "linear-gradient(150deg, #050810 0%, #0a1020 50%, #08060f 100%)" }} />
        <div ref={blobRef} className="absolute inset-0 pointer-events-none">
          <div data-hb="1" className="absolute rounded-full" style={{ width: 620, height: 620, top: "-12%", left: "-8%", background: "radial-gradient(circle, rgba(245,158,11,0.45) 0%, transparent 60%)", filter: "blur(40px)" }} />
          <div data-hb="2" className="absolute rounded-full" style={{ width: 520, height: 520, top: "-4%", right: "-6%", background: "radial-gradient(circle, rgba(244,63,94,0.38) 0%, transparent 60%)", filter: "blur(34px)" }} />
          <div data-hb="3" className="absolute rounded-full" style={{ width: 500, height: 500, bottom: "-6%", left: "26%", background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 60%)", filter: "blur(38px)" }} />
          <div data-hb="4" className="absolute rounded-full" style={{ width: 380, height: 380, top: "36%", left: "10%", background: "radial-gradient(circle, rgba(34,211,238,0.22) 0%, transparent 60%)", filter: "blur(30px)" }} />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
        <canvas ref={canvasRef} width={1440} height={900} className="absolute inset-0 w-full h-full" style={{ opacity: 0.9 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 55% 60% at 50% 44%, rgba(5,8,16,0.55) 0%, transparent 100%)" }} />
      </>
    );
  }

  return (
    <>
      {/* Light mode base — warm white with violet hint */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #fdf8ff 0%, #ffffff 45%, #f0f7ff 100%)" }} />
      {/* Light mode warm blobs — visible but soft */}
      <div ref={blobRef} className="absolute inset-0 pointer-events-none">
        <div data-hb="1" className="absolute rounded-full" style={{ width: 560, height: 560, top: "-12%", left: "-8%", background: "radial-gradient(circle, rgba(245,158,11,0.22) 0%, transparent 60%)", filter: "blur(65px)" }} />
        <div data-hb="2" className="absolute rounded-full" style={{ width: 460, height: 460, top: "-4%", right: "-6%", background: "radial-gradient(circle, rgba(244,63,94,0.18) 0%, transparent 60%)", filter: "blur(58px)" }} />
        <div data-hb="3" className="absolute rounded-full" style={{ width: 440, height: 440, bottom: "-6%", left: "26%", background: "radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 60%)", filter: "blur(62px)" }} />
        <div data-hb="4" className="absolute rounded-full" style={{ width: 320, height: 320, top: "36%", left: "10%", background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 60%)", filter: "blur(50px)" }} />
      </div>
      {/* Grid — dark lines for light bg */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
      {/* Canvas at lower opacity so it doesn't overwhelm the light base */}
      <canvas ref={canvasRef} width={1440} height={900} className="absolute inset-0 w-full h-full" style={{ opacity: 0.55 }} />
      {/* Light center vignette — pushes blobs to edges, clears reading zone */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 62% 68% at 50% 44%, rgba(255,255,255,0.88) 0%, transparent 100%)" }} />
    </>
  );
}

function HeroStatCounter({ target, label, color, isDark }: { target: number; label: string; color: string; isDark: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = target / 90;
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(Math.floor(cur));
      if (cur >= target) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [target]);
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color }}>{val.toLocaleString()}</div>
      <div className="text-xs mt-0.5" style={{ color: isDark ? "rgba(248,250,252,0.45)" : "rgba(15,15,25,0.5)", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const { toast } = useToast();
  const searchString = useSearch();
  const isDark = useIsDark();

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const authError = params.get("auth_error");
    if (authError) {
      toast({
        title: "Login Issue",
        description: "There was a problem signing in. Please try again. If the issue persists, try clearing your browser cookies or using the Replit dev URL.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/");
    }
  }, [searchString, toast]);

  // Theme-aware text color helpers
  const heroText    = isDark ? "#ffffff"                : "rgba(15,15,25,0.92)";
  const heroSub     = isDark ? "rgba(248,250,252,0.90)" : "rgba(15,15,25,0.72)";
  const heroMuted   = isDark ? "rgba(248,250,252,0.75)" : "rgba(15,15,25,0.56)";
  const heroFaint   = isDark ? "rgba(248,250,252,0.58)" : "rgba(15,15,25,0.42)";
  const secondaryBtn = isDark
    ? { background: "rgba(248,250,252,0.08)", color: "#f8fafc", border: "1px solid rgba(248,250,252,0.2)" }
    : { background: "rgba(15,15,25,0.06)", color: "#0f0f19", border: "1px solid rgba(15,15,25,0.18)" };
  const statBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";

  return (
    <div className="min-h-screen" data-testid="landing-page">
      <style>{`
        @keyframes heroGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <section className="relative overflow-hidden" style={{ minHeight: "100svh" }} data-testid="section-hero">
        <HeroBackground isDark={isDark} />

        {/* Content sits above all background layers */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center" style={{ minHeight: "100svh", paddingTop: 48, paddingBottom: 56 }}>

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(245,158,11,0.13)", border: "1px solid rgba(245,158,11,0.32)", color: "#d97706", letterSpacing: "0.06em" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#f59e0b" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#f59e0b" }} />
            </span>
            The Collaborative Advocate Foundation · Austin, TX → Nationwide
          </div>

          {/* Headline */}
          <h1 className="font-black mb-5 tracking-tight leading-tight" data-testid="text-hero-title"
            style={{ fontSize: "clamp(2.2rem,5.5vw,3.75rem)", color: heroText, maxWidth: 740, textShadow: isDark ? "0 2px 40px rgba(5,8,16,0.9)" : "0 1px 24px rgba(255,255,255,0.8)" }}>
            Built from community.
            <br />
            <span style={{ background: "linear-gradient(90deg,#d97706 0%,#e11d48 55%,#7c3aed 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Powered by data.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-4 px-2" data-testid="text-hero-subtitle"
            style={{ color: heroSub, fontSize: "1.05rem", maxWidth: 560, lineHeight: 1.75 }}>
            We equip youth, veterans, returning citizens, families, and the organizations that champion them — with AI-powered training, verifiable credentials, and the infrastructure to create lasting change from within.
          </p>

          <p className="text-sm mb-3 px-2" data-testid="text-hero-geography"
            style={{ color: heroMuted, maxWidth: 520, lineHeight: 1.7 }}>
            Built to work in any U.S. county.{" "}
            <Link href="/coverage" className="font-semibold hover:underline" style={{ color: "#d97706" }} data-testid="link-hero-coverage">
              Texas is our first deployment
            </Link>
            {" "}— Travis, Williamson, Hays, Bastrop, and Caldwell counties.
            Veteran-founded. Black-led. Built by people who've been where you are.
          </p>

          <p className="text-xs mb-2 px-2" data-testid="text-hero-philosophy"
            style={{ color: heroFaint, maxWidth: 500, lineHeight: 1.7 }}>
            Holistic. Agile. Agnostic. We meet every community where they are — through intentional collaboration, honest communication, and building together.
          </p>

          <p className="text-xs mb-8 px-2" data-testid="text-hero-identity"
            style={{ color: heroFaint, maxWidth: 560, lineHeight: 1.65 }}>
            ThriveUp is the community infrastructure platform — the operating system that empowers communities to coordinate workforce training, health equity, education, and case management across 6 domains, 15 service platforms, and 4-engine AI.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center mb-10">
            <Link href="/benefits-screener">
              <button className="px-7 py-3.5 rounded-lg font-semibold text-sm"
                style={{ background: "linear-gradient(135deg,#f59e0b,#e11d48)", color: "#fff", boxShadow: "0 0 28px rgba(245,158,11,0.32)", border: "none", cursor: "pointer" }}>
                Find What Your Family Qualifies For →
              </button>
            </Link>
            <Link href="/sdoh-explorer">
              <button className="px-7 py-3.5 rounded-lg font-semibold text-sm"
                style={{ ...secondaryBtn, backdropFilter: "blur(8px)", cursor: "pointer" }}>
                See Your Neighborhood's Data
              </button>
            </Link>
          </div>

          {/* Live stat strip */}
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 pt-6"
            style={{ borderTop: `1px solid ${statBorder}` }}>
            <HeroStatCounter target={15}  label="Platforms Online"          color="#0891b2" isDark={isDark} />
            <HeroStatCounter target={9}   label="Benefits Screened at Once" color="#059669" isDark={isDark} />
            <HeroStatCounter target={50}  label="States Deployable"         color="#7c3aed" isDark={isDark} />
          </div>
        </div>
      </section>

      <TrustBar />
      <DisciplineStrip />

      <section className="px-4 pb-4 sm:px-6 pt-8" data-testid="section-marcus-story">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/resident-journey"
            className="group block overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] no-underline"
            data-testid="card-marcus-story"
            aria-label="See Marcus's journey — the headline story for how we build stronger communities"
          >
            <div className="p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="rounded-xl p-3 bg-gradient-to-br from-violet-500 to-purple-600 shrink-0 shadow-md">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-2 text-xs" data-testid="badge-headline-story">
                    The headline story · How we build stronger communities
                  </Badge>
                  <h3 className="font-bold text-lg sm:text-xl mb-2 leading-tight" data-testid="text-marcus-story-title">
                    Meet Marcus. Foster youth. Incarcerated. Now reentering — and the system finally sees him as one person.
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed" data-testid="text-marcus-story-desc">
                    Most communities treat Marcus as seven different cases — child welfare, prison, probation, Medicaid, workforce, school, benefits.
                    Each office asks him to start over. We built a system where his story travels with him: across services, across states, across agencies.
                    <strong className="text-foreground"> Borders aren't real, but laws and policies are.</strong> The platform handles the policy layer
                    — through automation and integration — so families and frontline workers don't have to. Move Marcus from Austin to Wilmington and watch eligibility recompute in real time.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium shadow-sm" data-testid="button-see-marcus">
                      Walk Through Marcus's Journey
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-xs text-muted-foreground italic">
                      Live demo. No signup. See it for yourself.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="px-4 pb-4 sm:px-6" data-testid="section-tradesims-feature">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/academy/trade-sims"
            className="group block overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] no-underline"
            data-testid="card-tradesims-feature"
            aria-label="Try a free trade simulation — electrical, plumbing, HVAC, welding, automotive"
          >
            <div className="p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="rounded-xl p-3 bg-gradient-to-br from-amber-500 to-orange-600 shrink-0 shadow-md">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-2 text-xs" data-testid="badge-tradesims-feature">
                    Free workforce simulator · No account needed
                  </Badge>
                  <h3 className="font-bold text-lg sm:text-xl mb-2 leading-tight" data-testid="text-tradesims-title">
                    Can you wire a circuit? Fix a leaking pipe? Try it now — for free.
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed" data-testid="text-tradesims-desc">
                    Hands-on simulations for electrical, plumbing, HVAC, welding, and automotive — built for CTE students, returning citizens, and anyone exploring a trade career.
                    No tools. No classroom. No commitment. Try it and see if it clicks.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium shadow-sm" data-testid="button-try-tradesims">
                      Try a Trade Simulation — Free
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-xs text-muted-foreground italic">5 trades · Live physics · No signup required</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="px-4 pb-4 sm:px-6" data-testid="section-pathways">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-4">What brings you here today?</p>
          <div className="space-y-3">
            {PATHWAYS.map((pathway) => (
              <PathwayCard key={pathway.id} pathway={pathway} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Not sure where to start? That's okay.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/ai-companion">
                <Button variant="outline" className="gap-2" data-testid="button-talk-to-navigator">
                  <Sparkles className="h-4 w-4" /> Talk to Someone Who Can Help
                </Button>
              </Link>
              <a href="mailto:president@thecollaborativeadvocate.org">
                <Button variant="ghost" className="gap-2 text-muted-foreground" data-testid="button-email-us">
                  <Mail className="h-4 w-4" /> Or email us directly
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <ImpactNumbers />
      <StartHere />
      <CommunitiesWeServe />
      <WhatWeDeliver />
      <HowItWorks />

      <section className="py-12 px-4 sm:py-16 sm:px-6" data-testid="section-journey-flow">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">
              <Layers className="mr-1 h-3 w-3" /> End-to-End Pipeline
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-journey-flow-heading">From Community Data to Funded Programs</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Six integrated tools that take you from understanding your community's needs all the way to reporting outcomes. Each step feeds the next.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { step: 1, title: "Community Intelligence", desc: "Analyze SDOH data, map barriers, and understand community needs with live Census and CDC data.", href: "/sdoh-explorer", icon: Search },
              { step: 2, title: "Grant Discovery", desc: "AI-powered grant matching scores opportunities against your capacity and community alignment.", href: "/grants", icon: Target },
              { step: 3, title: "Program Designer", desc: "Design evidence-based programs using the Three Realities framework and AI-generated recommendations.", href: "/program-designer", icon: Sparkles },
              { step: 4, title: "Logic Model", desc: "Auto-populated logic model connecting inputs, activities, outputs, and outcomes with live platform data.", href: "/logic-model", icon: BarChart3 },
              { step: 5, title: "Grant Narrative", desc: "AI-generated narratives for WIOA, OJJDP, and SAMHSA grants, populated with real metrics.", href: "/grant-narrative", icon: BookOpen },
              { step: 6, title: "Outcome Reporting", desc: "Track recidivism, employment, education, housing, and behavioral health outcomes across cohorts.", href: "/outcomes", icon: TrendingUp },
            ].map((item) => (
              <Link key={item.step} href={item.href}>
                <Card className="p-5 hover-elevate cursor-pointer h-full" data-testid={`card-journey-step-${item.step}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{item.step}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary mt-2 ml-11">
                    <span>Explore</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SuccessStories />
      <EcosystemPlatformsSection />
      <DeepDiveSection />

      <section className="py-12 px-4 sm:py-16 sm:px-6 bg-gradient-to-br from-primary/5 via-background to-primary/10 border-t" data-testid="section-book-appointment">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Calendar className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-book-appointment-heading">
            Talk with Dr. Flood
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-2 max-w-2xl mx-auto" data-testid="text-book-appointment-subheading">
            Funder, partner, community leader, or organization curious about how this fits your work?
          </p>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
            Book a 30-minute conversation directly on Dr. Flood's calendar — no forms, no gatekeepers.
          </p>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => window.open('https://calendar.google.com/calendar/appointments/schedules/AcZssZ2O1JcnlDSXEidpWJKtc02RF37MRUytN66JNOkHDRxDParffIH6eSlbRe0DVXUbfpJwGFRp2bFG?gv=true', '_blank', 'noopener,noreferrer')}
            data-testid="button-book-appointment"
          >
            <Calendar className="h-4 w-4" />
            Book an Appointment
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <p className="text-xs text-muted-foreground/70 mt-4">
            Opens in Google Calendar · Free · No commitment
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 sm:py-10 sm:px-6 border-t bg-card" data-testid="footer-main">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-semibold" data-testid="text-footer-brand">ThriveUp Academy</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2" data-testid="text-footer-tagline">
                Empowering youth, veterans, returning citizens, families, and the organizations that champion them — with AI-powered workforce development and community infrastructure built to deploy in any U.S. county. Texas is our first deployment.
              </p>
              <p className="text-xs text-muted-foreground/70" data-testid="text-footer-foundation">
                The Collaborative Advocate Foundation · IRS-determined 501(c)(3) (Letter 947, eff. 01/14/2026) · SAM Active · CAGE 209N1
              </p>
            </div>
            <div data-testid="footer-column-platform">
              <h4 className="font-semibold text-sm mb-2">Platform</h4>
              <ul className="space-y-1.5">
                <li><Link href="/benefits-screener" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-screener">Benefits Screener</Link></li>
                <li><Link href="/sdoh-explorer" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-sdoh">SDOH Explorer</Link></li>
                <li><Link href="/grants" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-grants">Grant Discovery</Link></li>
                <li><Link href="/proposal-pipeline" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-pipeline">Proposal Pipeline</Link></li>
              </ul>
            </div>
            <div data-testid="footer-column-partners">
              <h4 className="font-semibold text-sm mb-2">For Partners</h4>
              <ul className="space-y-1.5">
                <li><Link href="/coalition" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-coalition">Coalition Portal</Link></li>
                <li><Link href="/health-network" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-health-network">Health Network</Link></li>
                <li><Link href="/ecosystem" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-ecosystem">Ecosystem Map</Link></li>
                <li><Link href="/outcomes" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-outcomes">Outcome Reports</Link></li>
                <li><Link href="/rplice-tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-rplice">Research Tools</Link></li>
              </ul>
            </div>
            <div data-testid="footer-column-contact">
              <h4 className="font-semibold text-sm mb-2">Contact</h4>
              <ul className="space-y-1.5">
                <li>
                  <a href="mailto:terryflood@thrivingcommunitiesforall.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5" data-testid="link-footer-email">
                    <Mail className="h-3 w-3" /> terryflood@thrivingcommunitiesforall.com
                  </a>
                </li>
                <li className="text-xs text-muted-foreground/70 mt-2">
                  17912 Stefano Drive<br />Pflugerville, TX 78660
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>TEKS Aligned</span>
              <span aria-hidden="true">&middot;</span>
              <span>Section 508</span>
              <span aria-hidden="true">&middot;</span>
              <span>FERPA Ready</span>
              <span aria-hidden="true">&middot;</span>
              <span>SOC 2 Framework</span>
            </div>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
