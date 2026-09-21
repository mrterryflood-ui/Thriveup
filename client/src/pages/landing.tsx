import { useEffect, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { JsonLd } from "@/components/json-ld";
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
  Siren, Eye, MessageSquare, Activity,
  Video, Megaphone, Network, Cpu,
  Rocket, MessageCircle, Compass, Users,
  Zap, FileText, Send, Lock, Star, Plug
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import { IDENTITY_STRAP, LANGUAGES_SHORT_PHRASE } from "@shared/canonical-claims";

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
    id: "find-help",
    icon: MapPin,
    title: "Find help near me",
    subtitle: "Local organizations, hotlines, and programs",
    description: "Search real government and community resources with coverage that varies by location — food, housing, healthcare, jobs, legal aid — plus crisis lines you can call right now.",
    action: "Find Help Near Me",
    href: "/get-help",
    color: "from-orange-500 to-red-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    urgency: "No login. Crisis lines available 24/7.",
  },
  {
    id: "talk",
    icon: MessageCircle,
    title: "I just want to talk to someone",
    subtitle: "Ask anything, in plain language",
    description: "The AI Navigator answers questions about benefits, housing, jobs, health, and your neighborhood — grounded in real data, in your language, no forms to fill out.",
    action: "Talk to the Navigator",
    href: "/navigator",
    color: "from-sky-500 to-blue-600",
    bgLight: "bg-sky-50 dark:bg-sky-950/20",
    borderColor: "border-sky-200 dark:border-sky-800",
    urgency: "Free to explore. 107 languages via AI translation.",
  },
  {
    id: "health",
    icon: Activity,
    title: "Health & wellness for me and my family",
    subtitle: "Screenings, wellness tools, care navigation",
    description: "One hub for health — wellness check-ins, prevention resources, and connections to care in your community.",
    action: "Go to Health & Wellness",
    href: "/health-wellness",
    color: "from-emerald-500 to-green-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    urgency: "Free tools. Local care connections.",
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
    urgency: "Census-based community context; geography varies.",
  },
  {
    id: "evaluate",
    icon: Search,
    title: "I'm considering funding or supporting this work",
    subtitle: "Funder, reviewer, evaluator, or prospective partner",
    description: "We built this in the open so you can see exactly how it works. Impact data, methodology, outcome tracking — nothing behind a login wall. Judge us by the evidence.",
    action: "See the model",
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
    description: "Connect your organization to a guided workflow for service-area context, benefits information, planning support, and reporting.",
    action: "Get My Partner Dashboard",
    href: "/for-nonprofits",
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    urgency: "Guided setup · Partner access options explained.",
  },
  {
    id: "affiliate",
    icon: Network,
    title: "My organization wants to join the Foundation Network",
    subtitle: "Church, CHW org, school district, reentry nonprofit, media partner",
    description: "You're already doing the work. Affiliate with the Foundation Network and gain platform access, shared referral pathways, outcome measurement, grant support, and co-branded intake — without giving up your identity or mission.",
    action: "Become an Affiliate Partner",
    href: "/partners/join",
    color: "from-teal-600 to-cyan-600",
    bgLight: "bg-teal-50 dark:bg-teal-950/20",
    borderColor: "border-teal-200 dark:border-teal-800",
    urgency: "Churches · CHW orgs · School districts · Reentry nonprofits · Media partners.",
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

// The homepage keeps a small set of featured pathways. The complete connected
// site directory lives in the sidebar so the landing story stays focused.
const FEATURED_SERVICE_PLATFORMS = [
  {
    name: "Whole-Person Health",
    description: "Mental wellness, safety planning, screenings, care navigation, and practical support that recognizes health is connected to every part of life.",
    href: "https://mentalwellnesssupport.net",
    icon: Heart,
    theme: "text-rose-600 bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300",
  },
  {
    name: "Sankofa Health Network",
    description: "A consolidated health gateway for responsive behavioral health, women's and maternal health, preventive care education, reproductive wellness, and connection to appropriate care.",
    href: "https://herhealthmatters2.com",
    icon: Stethoscope,
    theme: "text-pink-600 bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300",
  },
  {
    name: "MaleHealth Matters",
    description: "Preventive health information, screening navigation, peer connection, and practical support for men and their families.",
    href: "https://malehealthmatters2.com",
    icon: User,
    theme: "text-sky-600 bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300",
  },
  {
    name: "Mission Transition",
    description: "A military-to-civilian bridge for veterans and families: benefits, career translation, planning, purpose, and community connection.",
    href: "https://vetmissiontransition.com",
    icon: Shield,
    theme: "text-blue-600 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300",
  },
  {
    name: "Power2thePeople",
    description: "Explore Civic Signal for public civic information and community policy context. This link opens the Power2thePeople platform.",
    href: "https://power2thepeople.net",
    icon: Globe,
    theme: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  {
    name: "Better Science Lab",
    description: "Implementation science in action — CFIR, RE-AIM, and EPIS frameworks, an evidence-based practice registry, and research translation tools that turn studies into community programs.",
    href: "https://www.bettersciencelab.com",
    icon: Microscope,
    theme: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  {
    name: "TradeSparkFinance",
    description: "Financial intelligence for community-serving traders and small investors — market access, education, and tools built for people who have historically been locked out of financial markets.",
    href: "https://tradesparkfinance.com",
    icon: TrendingUp,
    theme: "text-amber-600 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300",
  },
  {
    name: "ChildCORE",
    description: "Community intelligence for child and family services — provider availability, school intelligence, and social-determinants data integrated directly into ThriveUp navigation and referral pathways.",
    href: "https://childcore.app",
    icon: Baby,
    theme: "text-violet-600 bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300",
  },
] as const;

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
            A veteran-founded, community-serving 501(c)(3) public charity headquartered in Pflugerville, Texas. Led by Dr. Terry Flood, DHA/DBA, President.
            TCAF is a nonprofit backbone; support and eligibility questions are handled transparently.
          </p>
          <p className="text-xs text-muted-foreground/70 max-w-2xl mx-auto">
            IRS Determination Letter 947 · Effective January 14, 2026 · Public charity under §170(b)(1)(A)(vi) · Form 990 series filer · Fiscal year ends December 31.
          </p>
        </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto mb-5">
            <div className="rounded-lg border-2 border-primary/30 bg-card/80 p-4 text-left" data-testid="card-entity-tcaf">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Nonprofit programs and grants</p>
              <h3 className="font-semibold">The Collaborative Advocate Foundation (TCAF)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The 501(c)(3) nonprofit lane for community navigation, mental health and wellness access, family support, education, workforce pathways, military transition support, and partner capacity.
              </p>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 pt-3 border-t text-xs">
                <div><dt className="text-muted-foreground">EIN</dt><dd className="font-mono font-semibold">41-3618003</dd></div>
                <div><dt className="text-muted-foreground">SAM.gov UEI</dt><dd className="font-mono font-semibold">KDDVD1FGLW35</dd></div>
                <div><dt className="text-muted-foreground">CAGE Code</dt><dd className="font-mono font-semibold">209N1</dd></div>
                <div><dt className="text-muted-foreground">SAM.gov</dt><dd className="font-semibold text-emerald-600 dark:text-emerald-400">Active</dd></div>
              </dl>
            </div>
            <div className="rounded-lg border bg-card/80 p-4 text-left" data-testid="card-entity-iss">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">For-profit delivery and contracting</p>
              <h3 className="font-semibold">Integrated Services and Solutions LLC (ISS LLC)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The for-profit lane for consulting, HR solutions, workforce development, training, contract delivery, supplies, maintenance support, and assembled project teams. It is not the 501(c)(3) applicant.
              </p>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 pt-3 border-t text-xs">
                <div><dt className="text-muted-foreground">EIN</dt><dd className="font-mono font-semibold">87-2795417</dd></div>
                <div><dt className="text-muted-foreground">SAM.gov UEI</dt><dd className="font-mono font-semibold">C7YDV3P8EHL7</dd></div>
                <div><dt className="text-muted-foreground">CAGE Code</dt><dd className="font-mono font-semibold">9VKK3</dd></div>
                <div><dt className="text-muted-foreground">SAM.gov</dt><dd className="font-semibold text-emerald-600 dark:text-emerald-400">Active</dd></div>
              </dl>
            </div>
          </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-501c3">
            <Shield className="mr-1 h-3 w-3" /> 501(c)(3) Determined
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-deductible">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Nonprofit backbone
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-vosb">
            <Shield className="mr-1 h-3 w-3" /> Veteran-Founded
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-sam-active">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Grant-readiness framework
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-coppa">
            <Shield className="mr-1 h-3 w-3" /> Privacy and dignity by design
          </Badge>
        </div>

        <p className="text-[11px] text-center text-muted-foreground/60 mt-4 max-w-2xl mx-auto">
          Verify our status directly: search EIN 41-3618003 on the{" "}
          <a
            href="https://apps.irs.gov/app/eos/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="IRS Tax Exempt Organization Search (opens in a new tab)"
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
            aria-label="SAM.gov (opens in a new tab)"
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
  const stats = [
    { value: "15",  label: "Service Platforms",   href: "/ecosystem" },
    { value: "4",   label: "AI Engines",           href: "/benefits-screener" },
    { value: "107", label: "Languages via AI Translation",  href: "/ecosystem" },
  ];
  return (
    <section className="py-10 px-4 bg-card" data-testid="section-impact-numbers">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <div className="py-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer group" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <p className="text-2xl sm:text-3xl font-bold text-primary group-hover:scale-110 transition-transform inline-block">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                <p className="text-[10px] text-primary/60 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Explore →</p>
              </div>
            </Link>
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
      href: "/curriculum",
      action: "See the Curriculum",
    },
    {
      icon: Briefcase, title: "Out-of-School Youth (16-24)",
      desc: "Equipped with GED pathways, AI-powered career exploration, and employer connections — giving young adults who were written off the tools to write their own story.",
      location: "Austin metro area",
      href: "/academy/careers",
      action: "Explore Career Paths",
    },
    {
      icon: Heart, title: "Foster Youth & Youth in Transition",
      desc: "Backed by the full weight of federal law — McKinney-Vento school rights with citations they can show a principal, Chafee and ETV funding up to $5,000/yr for training, an anonymous eligibility checker, and a direct bridge into trades and childcare career paths.",
      location: "Kansas pilot · national architecture",
      href: "/youth-rights",
      action: "Know Your Rights",
    },
    {
      icon: Shield, title: "Returning Citizens & Justice-Involved",
      desc: "Empowered to rebuild — with credential recovery, fair-chance employer partnerships, housing navigation, and 365-day retention tracking that proves they belong in the workforce.",
      location: "Travis County & surrounding counties",
      href: "/reentry",
      action: "See Reentry Support",
    },
    {
      icon: Award, title: "Veterans & Military Families",
      desc: "Equipped to translate military discipline into civilian careers — with skills mapping, benefits navigation, peer mentorship, and employer connections that honor their service.",
      location: "Central Texas",
      href: "/veterans",
      action: "See Veterans Support",
    },
    {
      icon: Heart, title: "Families Navigating Barriers",
      desc: "Empowered to access what they're entitled to — benefits screening across 9 programs in one conversation, plus housing, food, and wraparound support so they can focus on what's next.",
      location: "Any U.S. community",
      href: "/benefits-screener",
      action: "Screen for Benefits",
    },
    {
      icon: Building2, title: "Community & Faith-Based Organizations",
      desc: "Equipped with the infrastructure to run real workforce programs — track who you reach, coordinate referrals, report outcomes to funders, and prove the impact your community already knows you're making.",
      location: "Pflugerville, Manor, East Austin",
      href: "/coalition",
      action: "Join the Coalition",
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
            We take a whole-person approach — seeing the person, family, and community context together. We listen first, then connect practical tools, trusted partners, and evidence to the work people say they need.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {populations.map((p) => (
            <Link key={p.title} href={p.href} className="no-underline group">
              <Card className="p-5 flex flex-col h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer" data-testid={`card-population-${p.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="rounded-md bg-primary/10 p-2 shrink-0">
                    <p.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{p.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-3">{p.desc}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-primary/70">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{p.location}</span>
                  </div>
                  <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    {p.action} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatWeDeliver() {
  const programs = [
    {
      icon: Heart, title: "Whole-person health and mental wellness",
      desc: "Practical navigation, screening, prevention, and connection-to-care tools that recognize mental health alongside housing, work, family, safety, and other conditions that shape wellbeing.",
      href: "/health-wellness",
      action: "Explore health and wellness",
    },
    {
      icon: Shield, title: "Military transition and veteran pathways",
      desc: "Support for veterans, service members, and military families as they move between service and civilian life—including benefits navigation, skills translation, career preparation, and connections to community support.",
      href: "/transition-plans",
      action: "Explore transition support",
    },
    {
      icon: GraduationCap, title: "Workforce development and training",
      desc: "Career readiness, digital skills, skilled-trade learning, professional development, and practical training that help people and teams move from preparation to opportunity.",
      href: "/curriculum",
      action: "Explore learning pathways",
    },
    {
      icon: Briefcase, title: "Consulting, HR, and organizational support",
      desc: "We help organizations clarify needs, strengthen teams, improve operations, build workforce plans, and turn complex goals into practical work plans.",
      href: "/contact",
      action: "Talk with our team",
    },
    {
      icon: Wrench, title: "Contract delivery, supplies, and maintenance support",
      desc: "For eligible projects, ISS LLC can organize delivery across services, supplies, logistics, maintenance support, and the people needed to complete the work responsibly.",
      href: "/contact",
      action: "Discuss a project",
    },
    {
      icon: Building2, title: "Community infrastructure and evidence",
      desc: "We give nonprofits, schools, agencies, and community partners usable tools, local information, referrals, reporting, and planning support so good work can be coordinated and sustained.",
      href: "/for-nonprofits",
      action: "For organizations",
    },
  ];

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6 bg-card" data-testid="section-what-we-deliver">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-deliver-heading">What We Deliver</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            We bring people, organizations, and delivery partners from need to next step: care, preparation, training, coordination, project delivery, and learning. The work is community-serving, practical, and built to be used.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {programs.map((pr) => (
            <Link key={pr.title} href={pr.href} className="no-underline group">
              <Card className="p-5 h-full flex flex-col transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer" data-testid={`card-deliver-${pr.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="rounded-md bg-primary/10 p-2 shrink-0">
                    <pr.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{pr.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{pr.desc}</p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary mt-auto">
                  <span>{pr.action}</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformPortfolio() {
  return (
    <section id="platforms" className="py-14 px-4 sm:py-20 sm:px-6 bg-gradient-to-b from-card via-background to-card border-y" data-testid="section-platform-portfolio">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-10 sm:mb-12">
          <Badge variant="secondary" className="mb-3">
            <Layers className="mr-1 h-3 w-3" /> Featured pathways
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" data-testid="text-platform-portfolio-heading">
            One community engine. Deep support where people need it.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            TCAF delivers the ThriveUp community infrastructure: connected tools and support for people, families, and the organizations that serve them. Explore these featured pathways below, or view the complete connected-site directory when you are ready to go deeper.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURED_SERVICE_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const opensInsideThriveUp = "external" in platform && platform.external === false;
            return (
              <a
                key={platform.name}
                href={platform.href}
                target={opensInsideThriveUp ? undefined : "_blank"}
                rel={opensInsideThriveUp ? undefined : "noopener noreferrer"}
                aria-label={opensInsideThriveUp ? platform.name : `${platform.name} (opens in a new tab)`}
                className="group rounded-xl border bg-card p-5 min-h-[205px] flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 no-underline"
                data-testid={`card-platform-portfolio-${platform.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`rounded-lg p-2.5 ${platform.theme}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {opensInsideThriveUp
                    ? <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                    : <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />}
                </div>
                <h3 className="font-semibold text-base text-foreground mb-2">{platform.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{platform.description}</p>
                <span className="text-xs font-semibold text-primary mt-4 inline-flex items-center gap-1">
                  Explore platform <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border bg-background/70 p-5">
          <div>
            <p className="font-semibold">For nonprofits: bring your mission, not a technical team.</p>
            <p className="text-sm text-muted-foreground mt-1">TCAF helps you connect the right tools, data, partnerships, training, and reporting to the work your community already leads.</p>
          </div>
           <div className="flex flex-wrap gap-2 shrink-0">
             <Button asChild className="gap-2">
               <Link href="/agency-connector" data-testid="button-platform-portfolio-connect">
                 Connect your organization <ArrowRight className="h-4 w-4" />
               </Link>
             </Button>
             <Button asChild variant="outline" className="gap-2">
               <Link href="/ecosystem" data-testid="button-platform-portfolio-directory">
                 Open ecosystem command center <Globe className="h-4 w-4" />
               </Link>
             </Button>
           </div>
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
             <Award className="mr-1 h-3 w-3" /> Pathways the platform supports
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
  const hubs = [
    {
      icon: Heart, color: "from-emerald-500 to-teal-600", iconBg: "bg-emerald-100 text-emerald-700",
      label: "Serve People", href: "/hub/serve",
      role: "Frontline delivery — benefits screening, foster navigation, justice reentry, community health.",
      feeds: "Outcome data → grant proposals. Skill gaps → workforce training. Population trends → partner coordination.",
    },
    {
      icon: Target, color: "from-amber-500 to-orange-600", iconBg: "bg-amber-100 text-amber-700",
      label: "Get Funded", href: "/hub/fund",
      role: "The evidence layer — RFP intelligence, proposal writing, compliance, and win-rate analytics.",
      feeds: "Awarded grants → direct service capacity. Coalition evidence → more partner funding.",
    },
    {
      icon: Rocket, color: "from-blue-600 to-indigo-700", iconBg: "bg-blue-100 text-blue-700",
      label: "Grow", href: "/hub/grow",
      role: "Workforce readiness engine — Trade Sims, Academy curriculum, employer matching, AI tools.",
      feeds: "Credentialed graduates → serve-side employment outcomes. ROI data → workforce grant proposals.",
    },
    {
      icon: Network, color: "from-teal-600 to-cyan-700", iconBg: "bg-teal-100 text-teal-700",
      label: "Connect", href: "/hub/connect",
      role: "Coordination backbone — partner network, Foundation coalition, civic data, impact reporting.",
      feeds: "Shared referrals → Serve. Organizational capacity → Fund. Employer network → Grow.",
    },
  ];

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6" data-testid="section-how-it-works">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Layers className="h-3 w-3" />
            <span>Integrated by design</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-how-heading">
            Nothing operates in a silo.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Four coordinated hubs — each one doing its part, each one feeding the others. Outcomes from service delivery
            become evidence in grant proposals. Credentials earned in training become employment outcomes measured at 365 days.
            Partner coordination amplifies all of it. This is what a backbone organization actually looks like.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {hubs.map((hub) => (
            <Link key={hub.label} href={hub.href} className="no-underline group">
              <Card className="p-5 h-full flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer" data-testid={`card-hub-${hub.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${hub.color} flex items-center justify-center shadow-sm shrink-0`}>
                    <hub.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{hub.label}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{hub.role}</p>
                <div className="border-t border-border/40 pt-2 mt-auto">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Feeds →</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{hub.feeds}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                  <span>Open {hub.label}</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl bg-muted/50 border border-border/60 p-5 text-center">
          <p className="text-sm font-semibold mb-1">The conductor role</p>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            TCAF delivers community-serving tools and support while coordinating the infrastructure that makes services continuous, measurable, and fundable.
            Community members do not have to start over at every door: each connected hub can build on the next step, and responsible outcome tracking can become evidence that helps partners improve and funders understand progress.
          </p>
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
        { name: "Sankofa Health Network", url: "https://herhealthmatters2.com", desc: "Consolidated health and wellness gateway for responsive behavioral health, women's and maternal health, preventive care, and family navigation", icon: Stethoscope },
        { name: "MaleHealth Matters", url: "https://malehealthmatters2.com", desc: "Preventive screening, cardiovascular wellness, behavioral-health support, and peer mentoring", icon: User },
        { name: "SafeCogniCare", url: "https://safecognicare.com", desc: "TBI, ADHD, dementia, and peripartum cognitive assessments (MoCA, MMSE), safety protocols, care coordination", icon: Brain },
    ],
  },
  {
    domain: "Education & Youth",
    color: "from-amber-500 to-orange-600",
    platforms: [
      { name: "ISSS — Integrated Supports for Thriving Youth", url: "https://implementationineducatio.com", desc: "MTSS engine with Thrive Scores, early warning indicators, multi-stakeholder coordination for student support at scale", icon: School },
      { name: "Perfectly Different", url: "https://neurodifferentassistant.app", desc: "Neurodiversity-affirming support for autism, ADHD, AuDHD — IEP/504 plan builder, executive function coaching, sensory tools", icon: Sparkles },
      { name: "Better Science Lab / RPLICE", url: "https://www.bettersciencelab.com", desc: "Implementation science engine — CFIR, RE-AIM, EPIS frameworks, evidence-based practice registry, research translation tools", icon: Microscope },
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
      { name: "SafeReport", url: "https://safereports.net", desc: "Mandatory reporter system designed for 50-state policy coverage — 7-stage incident lifecycle, tamper-evident audit trails, court-admissible evidence packaging", icon: Shield },
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
  {
    domain: "Finance & Commerce",
    color: "from-amber-500 to-yellow-600",
    platforms: [
      { name: "TradeSparkFinance", url: "https://tradesparkfinance.com", desc: "Financial intelligence for community-serving traders and small investors — market access, education, and tools built for people historically locked out of financial markets", icon: TrendingUp },
    ],
  },
  {
    domain: "Funding & Grant Execution",
    color: "from-orange-500 to-amber-600",
    platforms: [
      { name: "GrantPathPro", url: "/for-agencies", desc: "Grant writing and proposal drafting, budget development, compliance review, submission tracking, funder relationships, and post-award reporting", icon: FileText },
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
            Our Ecosystem — Connected platform map
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
                      aria-label={`${platform.name} (opens in a new tab)`}
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
                 We build through intentional collaboration, transparent communication, and the conviction that every community has strengths to build on — with the infrastructure to make the work visible and useful.
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
                  { icon: TrendingUp, title: "Predictive Analytics Engine", desc: "Surfaces patterns and planning signals across six domains; scenario limits and source quality remain visible." },
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
              <Button asChild variant="default" data-testid="button-deep-health-network">
                <Link href="/health-network"><Heart className="mr-2 h-4 w-4" /> Health Network</Link>
              </Button>
              <Button asChild variant="outline" data-testid="button-deep-ecosystem">
                <Link href="/ecosystem"><Layers className="mr-2 h-4 w-4" /> Full Ecosystem Map</Link>
              </Button>
              <Button asChild variant="outline" data-testid="button-deep-sdoh">
                <Link href="/sdoh-explorer"><BarChart3 className="mr-2 h-4 w-4" /> SDOH Explorer</Link>
              </Button>
              <Button asChild variant="outline" data-testid="button-deep-grants">
                <Link href="/grants"><Search className="mr-2 h-4 w-4" /> Grant Hub</Link>
              </Button>
              <Button asChild variant="outline" data-testid="button-deep-rplice">
                <Link href="/rplice-tools"><Microscope className="mr-2 h-4 w-4" /> Research Tools</Link>
              </Button>
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
                <Button asChild variant="outline" size="sm" data-testid="button-mapgap-learn">
                  <Link href="/mapgap-framework"><BookOpen className="mr-1.5 h-3.5 w-3.5" /> Learn More About MAP-GAP</Link>
                </Button>
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
  const roles = [
    ["resident", "Resident or family"], ["young-person", "Young person"], ["veteran", "Veteran or military family"],
    ["student", "Student or learner"], ["nonprofit", "Nonprofit or community organization"], ["funder", "Funder or evaluator"],
    ["researcher", "Researcher"], ["healthcare", "Healthcare or CHW professional"], ["social-worker", "Social worker or case manager"],
    ["educator", "Educator"], ["policymaker", "Policymaker or public agency"], ["partner", "Technology or service partner"],
  ] as const;
  const goals = [
    ["help", "Find help or resources"], ["benefits", "See what I qualify for"], ["community", "Understand my community"],
    ["learn", "Learn or build skills"], ["coordinate", "Coordinate care or referrals"], ["program", "Build or improve a program"],
    ["measure", "Measure results and learn"], ["funding", "Find funding support"], ["integrate", "Connect tools or data"],
  ] as const;
  const [role, setRole] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const goalRoutes: Record<string, { href: string; title: string; next: string[] }> = {
    help: { href: "/get-help", title: "Find trusted help near you", next: ["Search resources", "Choose a next step", "Track what happens"] },
    benefits: { href: "/benefits-screener", title: "Screen for benefits in one place", next: ["Check eligibility", "Get application guidance", "Connect to support"] },
    community: { href: "/community-impact", title: "Build a community evidence picture", next: ["Choose a place", "See contributing conditions", "Connect evidence to action"] },
    learn: { href: "/curriculum", title: "Find a learning pathway", next: ["Choose a goal", "Build skills", "Move toward opportunity"] },
    coordinate: { href: "/services", title: "Coordinate services and referrals", next: ["Understand the need", "Connect the right support", "Close the referral loop"] },
    program: { href: "/program-designer", title: "Turn evidence into an implementable program", next: ["Define the need", "Prepare for implementation", "Improve with feedback"] },
    measure: { href: "/outcomes", title: "Connect activity, outcomes, and learning", next: ["Select meaningful measures", "Separate observed from estimated", "Use results to improve"] },
    funding: { href: "/for-nonprofits", title: "Connect readiness, evidence, and funding", next: ["Clarify capacity", "Align the opportunity", "Prepare the organization"] },
    integrate: { href: "/agency-connector", title: "Connect ThriveUp to your existing work", next: ["Choose the tools you need", "Set privacy and governance boundaries", "Connect without replacing your systems"] },
  };
  const roleOverrides: Record<string, Partial<Record<string, string>>> = {
    "young-person": { help: "/opportunity-youth", learn: "/academy", funding: "/fafsa-navigator" },
    veteran: { help: "/veterans", benefits: "/veterans", learn: "/transition-plans" },
    student: { learn: "/curriculum", funding: "/fafsa-navigator" },
    funder: { community: "/ecosystem-story", measure: "/ecosystem-story", funding: "/impact" },
    researcher: { community: "/research-hub", measure: "/research-hub", program: "/rplice-tools" },
    healthcare: { help: "/health-wellness", coordinate: "/health-network", program: "/program-designer" },
    "social-worker": { help: "/resource-directory", coordinate: "/services" },
    educator: { learn: "/curriculum", program: "/program-designer", measure: "/outcomes" },
    policymaker: { community: "/community-impact", measure: "/chainweb", program: "/implementation" },
    nonprofit: { integrate: "/agency-connector", funding: "/for-nonprofits", program: "/program-designer" },
    partner: { integrate: "/ecosystem", measure: "/partner-scorecard" },
  };
  const recommendation = goal ? goalRoutes[goal] : null;
  const selectedRoleLabel = roles.find(([value]) => value === role)?.[1];
  const recommendationHref = recommendation ? (roleOverrides[role]?.[goal] ?? recommendation.href) : "";

  return (
    <section className="py-10 px-4 sm:py-14 sm:px-6 bg-card border-y" data-testid="section-start-here">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <Badge variant="secondary" className="mb-3">
            <ArrowRight className="mr-1 h-3 w-3" /> Start Here
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold mb-1" data-testid="text-start-here-heading">
            Tell us what brings you here. We will connect the path.
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Choose what you want to accomplish and the role or situation that best describes you. You can change either choice at any time.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <Card className="p-5 border-2" data-testid="card-guided-front-door">
            <fieldset>
              <legend className="text-sm font-bold mb-3">1. What are you trying to do?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {goals.map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setGoal(value)}
                    className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${goal === value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/50"}`}
                    aria-pressed={goal === value} data-testid={`goal-${value}`}>{label}</button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-5">
              <legend className="text-sm font-bold mb-3">2. Which best describes you?</legend>
              <label htmlFor="front-door-role" className="sr-only">Which best describes you?</label>
              <select id="front-door-role" value={role} onChange={(event) => setRole(event.target.value)}
                className="w-full min-h-11 rounded-lg border bg-background px-3 text-sm" data-testid="select-front-door-role">
                <option value="">Choose a role or situation</option>
                {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </fieldset>
          </Card>
          <Card className="p-5 border-2 min-h-[260px] flex flex-col" data-testid="card-connected-recommendation">
            {recommendation && role ? (
              <>
                <Badge className="w-fit mb-3">Your connected starting point</Badge>
                <h3 className="text-xl font-bold mb-2" data-testid="text-recommendation-title">{recommendation.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start here for “{goals.find(([value]) => value === goal)?.[1]}” as a {selectedRoleLabel?.toLowerCase()}.
                </p>
                <ol className="space-y-2 mb-5">
                  {recommendation.next.map((step, index) => <li key={step} className="flex items-center gap-2 text-sm"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">{index + 1}</span>{step}</li>)}
                </ol>
                <Button asChild className="w-full min-h-11 mt-auto" data-testid="button-open-connected-path"><Link href={recommendationHref}>Open my pathway <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              </>
            ) : (
              <div className="m-auto text-center max-w-sm"><Network className="h-10 w-10 text-primary/60 mx-auto mb-3" /><h3 className="font-bold mb-2">One front door. Many connected paths.</h3><p className="text-sm text-muted-foreground">Make both choices to receive a tailored starting point and see how the next actions connect.</p></div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}

// ─── Cross-Sector Organizational Front Doors ────────────────────────────────
const SECTOR_DOORS = [
  {
    icon: Building2,
    label: "Nonprofits & Community Organizations",
    desc: "Infrastructure, referrals, grants, capacity building, outcome reporting, and coalition coordination.",
    href: "/for-nonprofits",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800",
    accent: "#7c3aed",
  },
  {
    icon: School,
    label: "Schools & Workforce Systems",
    desc: "Student transitions, career pathways, workforce development, family engagement, and apprenticeships.",
    href: "/academy",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    accent: "#d97706",
  },
  {
    icon: Stethoscope,
    label: "Healthcare & Community Care",
    desc: "Clinical navigation, SDOH integration, care coordination, community health workers, and screeners.",
    href: "/health-network",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800",
    accent: "#e11d48",
  },
  {
    icon: Globe,
    label: "Cities, States & Public Agencies",
    desc: "Population intelligence, equity analysis, program coordination, and system-level implementation.",
    href: "/community-impact",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    accent: "#2563eb",
  },
  {
    icon: Shield,
    label: "Justice & Community Safety",
    desc: "Reentry, diversion, crisis response, victim services, and community violence prevention planning.",
    href: "/justice",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    accent: "#059669",
  },
  {
    icon: Target,
    label: "Funders & Evaluators",
    desc: "Evidence, fidelity, outcome receipts, grant intelligence, and implementation accountability.",
    href: "/funder-dashboard",
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800",
    accent: "#ea580c",
  },
];

function CrossSectorDoors() {
  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6 bg-card border-y" data-testid="section-cross-sector-doors">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            <Network className="mr-1 h-3 w-3" /> All Sectors
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-cross-sector-heading">
            One platform. Every mission-driven sector.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Whether you lead a nonprofit, run a school, coordinate healthcare, work in government, or fund community work — start from where you are. The platform connects to the same evidence, resources, and coordination infrastructure underneath.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTOR_DOORS.map((door) => (
            <Link key={door.href} href={door.href} className="no-underline group" data-testid={`card-sector-door-${door.label.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
              <div className={`rounded-2xl border p-5 h-full flex flex-col transition-all duration-200 hover:shadow-md hover:scale-[1.01] cursor-pointer ${door.bg} ${door.border}`}>
                <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center bg-gradient-to-br ${door.color} mb-3 shrink-0`}>
                  <door.icon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-sm mb-1.5 leading-snug" style={{ color: door.accent }}>{door.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{door.desc}</p>
                <div className="flex items-center gap-1 text-xs font-semibold mt-3" style={{ color: door.accent }}>
                  <span>Enter this door</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6 max-w-lg mx-auto">
          Every door connects to the same community intelligence, evidence, referral, coordination, and implementation backbone. Issues that cross sectors — health and housing, education and workforce, justice and family — stay connected inside the platform.
        </p>
      </div>
    </section>
  );
}

// ─── Implementation Support Modes ────────────────────────────────────────────
function ImplementationModes() {
  const modes = [
    {
      icon: Cpu,
      label: "Self-Service",
      desc: "Access the full platform independently. Use the community intelligence tools, Navigator, benefits screener, resource directory, grant discovery, referral workflows, and outcome reporting on your own timeline.",
      note: "Always free.",
      color: "from-blue-500 to-indigo-600",
      accent: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: Compass,
      label: "Guided Implementation",
      desc: "TCAF works alongside your team to configure your workspace, map your stakeholders and resources, translate research into practice, train staff, and establish workflows and outcome measures.",
      note: "Funded as a service line item.",
      color: "from-violet-500 to-purple-600",
      accent: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/20",
    },
    {
      icon: HandshakeIcon,
      label: "TCAF-Managed Coordination",
      desc: "Delegate specific responsibilities to TCAF: administration, partner coordination, constituent navigation, referral management, fidelity monitoring, reporting, and continuous improvement.",
      note: "Customer-defined scope. Funded as a collaborative agreement.",
      color: "from-emerald-500 to-teal-600",
      accent: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
    },
  ];

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6" data-testid="section-implementation-modes">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            <Layers className="mr-1 h-3 w-3" /> Three Ways to Work With Us
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-impl-modes-heading">
            Free software. Optional TCAF implementation support.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            The platform is free. The work of implementing it well — coordinating stakeholders, training teams, maintaining fidelity — requires skilled people. TCAF can provide that workforce when you need it.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {modes.map((mode) => (
            <div key={mode.label} className={`rounded-2xl p-5 flex flex-col ${mode.bg}`} data-testid={`card-impl-mode-${mode.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center bg-gradient-to-br ${mode.color} mb-3 shrink-0`}>
                <mode.icon className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <h3 className={`font-bold text-sm mb-2 ${mode.accent}`}>{mode.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{mode.desc}</p>
              <p className={`text-[11px] font-semibold mt-3 ${mode.accent}`}>{mode.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/for-nonprofits">
            <Button variant="outline" className="gap-2" data-testid="button-impl-modes-cta">
              <HandshakeIcon className="h-4 w-4" />
              Learn how to work with TCAF
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
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

// ─── Service Platform Declaration ────────────────────────────────────────────
function ServicePlatformSection() {
  const audiences = [
    {
      icon: Building2,
      color: "from-violet-500 to-purple-600",
      border: "border-violet-200 dark:border-violet-800",
      bg: "bg-violet-50 dark:bg-violet-950/20",
      title: "Nonprofits",
      sub: "Community organizations, social service agencies, faith-based orgs, CHW networks",
      bullets: [
        "Map your mission, service area, and community priorities",
        "Connect to local data, resource navigation, and referral pathways",
        "Preview recommended tools before choosing what to adopt",
        "Use reporting and evidence tools to show what your work is learning",
        "Keep your organization in the lead; TCAF supplies backbone infrastructure",
      ],
      cta: "Connect your organization",
      href: "/agency-connector",
    },
    {
      icon: Globe,
      color: "from-blue-500 to-indigo-600",
      border: "border-blue-200 dark:border-blue-800",
      bg: "bg-blue-50 dark:bg-blue-950/20",
      title: "Government Agencies",
      sub: "City departments, county offices, state agencies, planning commissions",
      bullets: [
        "Multi-geography comparison across jurisdictions",
        "CEDS-aligned regional economic data (EDA PM1–PM5 framework)",
        "Community Health Needs Assessment (CHNA) generation — IRS-required for hospitals",
        "Cost-of-inaction modeling to justify public investment",
        "Secure API integration with existing government data systems",
      ],
      cta: "Explore community intelligence",
      href: "/community-compare",
    },
    {
      icon: Target,
      color: "from-amber-500 to-orange-600",
      border: "border-amber-200 dark:border-amber-800",
      bg: "bg-amber-50 dark:bg-amber-950/20",
      title: "Funders & Evaluators",
      sub: "Foundations, CDFIs, health systems, impact investors, grant reviewers",
      bullets: [
        "See how local context becomes a planning question",
        "Inspect the evidence and assumptions behind a community brief",
        "Follow the path from partner adoption to service delivery",
        "Separate observed outcomes, estimates, and open questions",
        "Use the connected ecosystem story to evaluate the whole loop",
      ],
      cta: "Follow the evidence loop",
      href: "/ecosystem-story",
    },
  ];

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6 bg-gradient-to-br from-background via-card to-background border-t" data-testid="section-service-platform">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3 text-xs">
            <Briefcase className="mr-1 h-3 w-3" /> Community infrastructure
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-service-platform-heading">
            The infrastructure layer for organizations that serve communities.
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            TCAF equips nonprofits and community organizations with connected tools, local information, referrals, planning support, and reporting. The partner remains the mission lead and decides what to adopt; TCAF provides the backbone that helps the work move from context to action and learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {audiences.map((a) => (
            <div
              key={a.title}
              className={`rounded-xl border-2 ${a.border} ${a.bg} p-5 flex flex-col`}
              data-testid={`card-service-audience-${a.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className={`rounded-xl p-3 bg-gradient-to-br ${a.color} w-fit mb-4 shadow-md`}>
                <a.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-base mb-1">{a.title}</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{a.sub}</p>
              <ul className="space-y-1.5 mb-5 flex-1">
                {a.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-foreground/80 leading-snug">{b}</span>
                  </li>
                ))}
              </ul>
              <Link href={a.href}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r ${a.color} shadow-sm hover:opacity-90 transition-opacity text-center`}
                data-testid={`button-service-cta-${a.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  {a.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Tiers ────────────────────────────────────────────────────────────
function PricingTiersSection() {
  const tiers = [
    {
      name: "Community",
      price: "Free",
      priceNote: "Always free for community members",
      color: "from-emerald-500 to-teal-600",
      border: "border-emerald-200 dark:border-emerald-800",
      highlight: false,
      audience: "Individuals, families, community advocates",
      features: [
        "Benefits screener — 9 programs, one conversation",
        "Community data explorer — any U.S. ZIP",
        "AI Navigator — plain-language guidance",
        "Trade simulations — 5 trades, no signup",
        "AI literacy curriculum — self-paced",
        LANGUAGES_SHORT_PHRASE,
      ],
      cta: "Start Free",
      href: "/benefits-screener",
      badge: null,
    },
    {
      name: "Partner",
      price: "$495",
      priceNote: "per month · billed annually",
      color: "from-violet-500 to-purple-600",
      border: "border-violet-400 dark:border-violet-600",
      highlight: true,
      audience: "Nonprofits, CHW organizations, community agencies",
      features: [
        "Everything in Community",
        "Unlimited community briefs — any U.S. geography",
        "AI grant narrative builder (WIOA · OJJDP · SAMHSA · ACF)",
        "RFP compliance matrix + gap analysis",
        "Community Invoice PDF — funder-ready leave-behind",
        "Funding intelligence matched to partner profiles",
        "Outcome tracking dashboard",
        "Grant Path Pro integration — push needs assessment directly",
        "Email support + quarterly check-in",
      ],
      cta: "Start Partner Trial",
      href: "/partners/join",
      badge: "Most Popular",
    },
    {
      name: "Enterprise",
      price: "$2,800",
      priceNote: "per month · custom contracts available",
      color: "from-amber-500 to-orange-600",
      border: "border-amber-200 dark:border-amber-800",
      highlight: false,
      audience: "Government agencies, health systems, CDFIs, large foundations",
      features: [
        "Everything in Partner",
        "Multi-jurisdiction comparison dashboard",
        "CEDS regional alignment (12 TX EDD regions, expandable)",
        "Custom Community Health Needs Assessment (CHNA) reports",
        "White-label community brief with your branding",
        "Secure API access — integrate into your own systems",
        "Dedicated integration support for Grant Path Pro",
        "SLA-backed uptime · SOC 2 framework",
        "Priority support + dedicated success manager",
      ],
      cta: "Talk to Dr. Flood",
      href: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2O1JcnlDSXEidpWJKtc02RF37MRUytN66JNOkHDRxDParffIH6eSlbRe0DVXUbfpJwGFRp2bFG?gv=true",
      badge: "Government · Health System · CDFI",
    },
  ];

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6 bg-card border-y" data-testid="section-pricing-tiers">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3 text-xs">
            <DollarSign className="mr-1 h-3 w-3" /> Pricing
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-pricing-heading">
            Free for families. Built for organizations. Scaled for government.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            The community tier is and will always be free. Organization and government plans fund the infrastructure that keeps it that way.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl border-2 ${tier.border} bg-background p-5 flex flex-col ${tier.highlight ? "shadow-xl ring-2 ring-violet-400/30 scale-[1.02]" : ""}`}
              data-testid={`card-pricing-${tier.name.toLowerCase()}`}
            >
              {tier.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${tier.color} shadow-md whitespace-nowrap`}>
                  {tier.badge}
                </div>
              )}
              <div className={`rounded-xl p-2.5 bg-gradient-to-br ${tier.color} w-fit mb-3 shadow-sm`}>
                {tier.name === "Community" && <Heart className="h-5 w-5 text-white" />}
                {tier.name === "Partner" && <HandshakeIcon className="h-5 w-5 text-white" />}
                {tier.name === "Enterprise" && <Building2 className="h-5 w-5 text-white" />}
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">{tier.name}</p>
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-2xl font-black">{tier.price}</span>
                {tier.price !== "Free" && <span className="text-xs text-muted-foreground">/mo</span>}
              </div>
              <p className="text-[10px] text-muted-foreground mb-2 leading-tight">{tier.priceNote}</p>
              <p className="text-xs font-medium mb-4 text-foreground/70 leading-snug border-b pb-3">{tier.audience}</p>
              <ul className="space-y-1.5 mb-5 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-foreground/80 leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
              {tier.href.startsWith("http") ? (
                <a href={tier.href} target="_blank" rel="noopener noreferrer"
                  aria-label={`${tier.cta} (opens in a new tab)`}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r ${tier.color} shadow-sm hover:opacity-90 transition-opacity text-center`}
                  data-testid={`button-pricing-cta-${tier.name.toLowerCase()}`}>
                    {tier.cta} →
                </a>
              ) : (
                <Link href={tier.href}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r ${tier.color} shadow-sm hover:opacity-90 transition-opacity text-center`}
                  data-testid={`button-pricing-cta-${tier.name.toLowerCase()}`}>
                    {tier.cta} →
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Nonprofit discount available · Government cooperative purchasing accepted · TCAF is a 501(c)(3) — grants may cover subscription costs
        </p>
      </div>
    </section>
  );
}

// ─── Live Partner Intelligence Network ───────────────────────────────────────
// Shows live connection badges for each data partner. ChildCORE ping is the
// only one fetched client-side (no auth required). Others are described
// truthfully from configuration.

const PARTNER_NETWORK = [
  {
    id: "childcore",
    name: "ChildCORE",
    tagline: "Community providers, schools, SDOH & impact data",
    description: "Pulls live provider registries, school intelligence, social determinants data, and aggregate community impact by ZIP or geography. Two-way: ThriveUp also pushes community activity back.",
    docsUrl: null,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    accent: "text-blue-700 dark:text-blue-400",
    pingUrl: "/api/childcore/ping",
    livePing: true,
  },
  {
    id: "civic-signal",
    name: "Civic Signal",
    tagline: "Real-time implementation lessons across communities",
    description: "Bidirectional exchange of community implementation lessons. ThriveUp pushes curriculum and practice lessons; Civic Signal returns partner intelligence on what's working in comparable communities.",
    docsUrl: "https://power2thepeople.net",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800",
    accent: "text-violet-700 dark:text-violet-400",
    livePing: false,
    configured: true,
  },
  {
    id: "rplice",
    name: "RPLICE · bettersciencelab.com",
    tagline: "Implementation science frameworks, research & grant intelligence",
    description: "49 curated implementation science studies, CFIR 2.0 / RE-AIM / EPIS / PRISM frameworks, grant-alignment scoring, and real-time community analysis. Powers the Navigator's evidence layer.",
    docsUrl: "https://www.bettersciencelab.com",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    accent: "text-emerald-700 dark:text-emerald-400",
    livePing: false,
    configured: true,
  },
  {
    id: "census",
    name: "U.S. Census ACS",
    tagline: "Population, income, poverty, SNAP, health coverage by ZIP",
    description: "Live ACS 5-year estimates for every ZIP code in the country — income, poverty, unemployment, SNAP, uninsured, education attainment, and Social Vulnerability Index. Informs every community intelligence request.",
    docsUrl: "https://www.census.gov/data/developers/data-sets/acs-5year.html",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    accent: "text-amber-700 dark:text-amber-400",
    livePing: false,
    configured: true,
  },
];

function PartnerNetworkSection() {
  const [childcoreStatus, setChildcoreStatus] = useState<"checking" | "live" | "unavailable">("checking");
  const [childcoreDocsUrl, setChildcoreDocsUrl] = useState<string | null>(null);
  const [childcoreDocsLoading, setChildcoreDocsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/childcore/ping", { cache: "no-store" })
      .then(r => r.json())
      .then(ping => setChildcoreStatus(ping?.ok ? "live" : "unavailable"))
      .catch((error) => {
        console.warn("[Landing] ChildCORE liveness unavailable:", error);
        setChildcoreStatus("unavailable");
      });
    fetch("/api/childcore/public-config")
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(config => setChildcoreDocsUrl(config?.docsUrl ?? null))
      .catch((error) => {
        console.warn("[Landing] ChildCORE destination unavailable:", error);
        setChildcoreDocsUrl(null);
      })
      .finally(() => setChildcoreDocsLoading(false));
  }, []);

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6 bg-card border-y" data-testid="section-partner-network">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            <Plug className="mr-1 h-3 w-3" /> Live Data Partners
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-partner-network-heading">
            Community intelligence from live, connected sources.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Every community intelligence request draws from multiple live data partners simultaneously — Census, implementation science, community lessons, and local provider registries — and keeps the source class visible so the AI never blurs observed data with modeled inference.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PARTNER_NETWORK.map((partner) => {
            const status = partner.id === "childcore"
              ? childcoreStatus
              : partner.configured ? "live" : "unavailable";

            return (
              <div
                key={partner.id}
                className={`rounded-2xl border p-5 flex flex-col gap-3 ${partner.bg} ${partner.border}`}
                data-testid={`card-partner-${partner.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`inline-flex w-9 h-9 rounded-xl items-center justify-center bg-gradient-to-br ${partner.color} shrink-0`}>
                    <Activity className="h-4 w-4 text-white" aria-hidden="true" />
                  </div>
                  {/* Live badge */}
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${
                    status === "live"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      : status === "checking"
                      ? "bg-muted text-muted-foreground"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status === "live" ? "bg-green-500 animate-pulse" : status === "checking" ? "bg-muted-foreground" : "bg-amber-500"}`} />
                    {status === "checking" ? "Checking…" : status === "live" ? "Live" : "Unavailable"}
                  </span>
                </div>
                <div>
                  <h3 className={`font-bold text-sm mb-0.5 ${partner.accent}`}>{partner.name}</h3>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{partner.tagline}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{partner.description}</p>
                </div>
                {partner.id === "childcore" && childcoreDocsLoading ? (
                  <span className="text-[11px] text-muted-foreground mt-auto" data-testid="text-partner-childcore-docs-checking">
                    Checking platform docs…
                  </span>
                ) : (partner.id === "childcore" ? childcoreDocsUrl : partner.docsUrl) ? (
                  <a
                    href={partner.id === "childcore" ? childcoreDocsUrl! : partner.docsUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-auto hover:underline ${partner.accent}`}
                    data-testid={`link-partner-${partner.id}-docs`}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View platform docs
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground mt-auto" data-testid={`text-partner-${partner.id}-docs-unavailable`}>
                    Platform docs unavailable
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 max-w-lg mx-auto">
          All partner data is verified on inbound, labeled by evidence class (observed / derived / modeled / partner-reported), and never silently blended with independently verified data. Partners receive only the data they are authorized to pull.
        </p>
      </div>
    </section>
  );
}

// ─── Grant Path Pro Integration Panel ────────────────────────────────────────
function GrantPathProSection() {
  const flow = [
    { icon: Search,    label: "Enter any ZIP",          desc: "Type any U.S. community — city, county, or ZIP code" },
    { icon: BarChart3, label: "Get the analysis",       desc: "Census-sourced indicators and a TCAF-derived needs assessment" },
    { icon: FileText,  label: "Invoice + scenario",     desc: "Download the Community Invoice with modeled cascade and ROI clearly labeled" },
    { icon: Send,      label: "Push to GrantPathPro",   desc: "With authorization, send the selected package — needs assessment, domain scores, matched grants" },
    { icon: Zap,       label: "Execute & monitor",      desc: "GrantPathPro handles grant writing, submission tracking, compliance, and reporting" },
  ];

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6 border-t" data-testid="section-grantpathpro">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/60 via-background to-amber-50/30 dark:from-amber-950/20 dark:to-background overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="rounded-xl p-3 bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shrink-0">
                <Plug className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-gpp-heading">
                     ThriveUp + GrantPathPro
                  </h2>
                  <Badge className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300">
                    Integrated
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Two complementary platforms. ThriveUp generates the intelligence — community needs, financial impact, grant alignment.
                   GrantPathPro helps you write, strengthen, execute, and monitor grants. With the partner organization’s authorization, the handoff keeps the pursuit connected across platforms.
                 </p>
                 <a
                   href="/for-agencies"
                   target="_blank"
                   rel="noopener noreferrer"
                    aria-label="Learn about GrantPathPro funding opportunities (opens in a new tab)"
                   className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline mt-2"
                   data-testid="link-gpp-website"
                 >
                   Explore GrantPathPro opportunities <ExternalLink className="h-3 w-3" />
                 </a>
              </div>
            </div>

            {/* Flow diagram */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 mb-8 overflow-x-auto pb-2">
              {flow.map((step, i) => (
                <div key={step.label} className="flex items-center gap-0 shrink-0">
                  <div className="flex flex-col items-center text-center w-[120px] sm:w-[110px]" data-testid={`step-gpp-flow-${i + 1}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-sm ${i === 3 ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-primary/10"}`}>
                      <step.icon className={`h-4 w-4 ${i === 3 ? "text-white" : "text-primary"}`} />
                    </div>
                    <p className="text-[10px] font-bold leading-tight mb-0.5">{step.label}</p>
                    <p className="text-[9px] text-muted-foreground leading-snug hidden sm:block">{step.desc}</p>
                  </div>
                  {i < flow.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 mx-1 shrink-0 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>

            {/* What each platform does */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-border/60 bg-background/80 p-4" data-testid="card-gpp-thriveup-role">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <BarChart3 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-bold">ThriveUp does</span>
                </div>
                <ul className="space-y-1">
                  {[
                    "Census-sourced community indicators + derived needs assessment",
                    "Historical cost cascade (4 vintages, 2013–2022)",
                    "25-year forward projection + modeled ROI scenario (not guaranteed)",
                    "Funding intelligence matched to partner profiles",
                    "AI narrative for any RFP section",
                    "Community Invoice PDF",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px]">
                      <CheckCircle2 className="h-3 w-3 text-violet-500 shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/80 p-4" data-testid="card-gpp-grantpathpro-role">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                   <span className="text-xs font-bold">GrantPathPro does</span>
                </div>
                <ul className="space-y-1">
                  {[
                     "Grant writing and proposal drafting",
                     "Budget building and compliance review",
                     "Grant execution workflow management",
                    "Submission tracking and deadline alerts",
                    "Compliance monitoring and reporting",
                    "Budget management and spend tracking",
                    "Funder relationship management",
                    "Post-award outcome reporting",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px]">
                      <CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link href="/community-impact"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-sm hover:opacity-90 transition-opacity"
                data-testid="button-gpp-generate-brief">
                  Generate a Community Brief →
              </Link>
              <span className="text-xs text-muted-foreground">
                 Then send the selected package to GrantPathPro with authorization
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <Lock className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[10px] text-muted-foreground/60">Secure API · Census-sourced · Audit-logged</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FiveWTeaser() {
  const points = [
    {
      w: "WHO",
      icon: Users,
      headline: "The backbone — not a competitor",
      body: "We are the nonprofit for nonprofits, residents, and communities to thrive. We bring tools, data, and funding knowledge. You bring the mission. We amplify what you already do.",
    },
    {
      w: "HOW",
      icon: Compass,
      headline: "IGN — we meet you where you are",
      body: "Initial Guidance and Navigation: your pace, your readiness, your community. We give you the tools and teach you how to use them. All issues are local — every pathway is tailored.",
    },
    {
      w: "WHY",
      icon: Heart,
      headline: "Advocacy + passion → sustainable solutions",
      body: "\"No one cares how much you know until they know how much you care.\" We deliver and prove impact so communities thrive beyond any single grant or program cycle.",
    },
  ];

  return (
    <section className="py-8 px-4 sm:px-6 bg-card border-b" data-testid="section-five-w-teaser">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              The Collaborative Advocate Foundation
            </p>
            <h2 className="text-xl font-bold mt-0.5" data-testid="text-five-w-heading">
              We are stronger together.
            </h2>
          </div>
          <Button asChild variant="outline" size="sm" data-testid="link-our-approach-teaser">
            <Link href="/our-approach">How we work <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.w}
                className="rounded-xl border bg-background p-4 space-y-2"
                data-testid={`card-teaser-${p.w.toLowerCase()}`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-bold tracking-wider">{p.w}</Badge>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="font-semibold text-sm leading-snug">{p.headline}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <Link href="/our-approach" className="text-xs text-primary hover:underline font-medium" data-testid="link-full-approach">
            See all 5 W's answered — Who, What, Where, When, Why, and How →
          </Link>
        </div>
      </div>
    </section>
  );
}

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

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function HeroBackground({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const blobRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
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
      animRef.current = 0;
      if (document.hidden) return;
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
      if (!document.hidden) animRef.current = requestAnimationFrame(draw);
    }

    const schedule = () => {
      if (!document.hidden && animRef.current === 0) {
        animRef.current = requestAnimationFrame(draw);
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animRef.current !== 0) {
          cancelAnimationFrame(animRef.current);
          animRef.current = 0;
        }
      } else {
        schedule();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    schedule();
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (animRef.current !== 0) cancelAnimationFrame(animRef.current);
      animRef.current = 0;
    };
  }, [isDark, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    let tick = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const update = () => {
      tick += 0.005;
      if (!blobRef.current) return;
      blobRef.current.querySelectorAll<HTMLElement>("[data-hb]").forEach((b, i) => {
        const ph = tick + i * 1.4;
        b.style.transform = `translate(${Math.sin(ph * 0.5) * 28}px,${Math.cos(ph * 0.4) * 22}px) scale(${1 + Math.sin(ph * 0.7) * 0.07})`;
      });
    };
    const start = () => {
      if (!document.hidden && intervalId === null) intervalId = setInterval(update, 16);
    };
    const stop = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const handleVisibilityChange = () => document.hidden ? stop() : start();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    start();
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stop();
    };
  }, [reducedMotion]);

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
  const reducedMotion = usePrefersReducedMotion();
  useEffect(() => {
    if (reducedMotion) {
      setVal(target);
      return;
    }
    setVal(0);
    let cur = 0;
    const step = target / 90;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const update = () => {
      cur = Math.min(cur + step, target);
      setVal(Math.floor(cur));
      if (cur >= target && intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const start = () => {
      if (!document.hidden && cur < target && intervalId === null) intervalId = setInterval(update, 18);
    };
    const stop = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const handleVisibilityChange = () => document.hidden ? stop() : start();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    start();
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stop();
    };
  }, [target, reducedMotion]);
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color }}>{val.toLocaleString()}</div>
      <div className="text-xs mt-0.5" style={{ color: isDark ? "rgba(248,250,252,0.45)" : "rgba(15,15,25,0.5)", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

function HealthEquityFirstGlance({ isDark }: { isDark: boolean }) {
  const steps = [
    { label: "Map the place", detail: "Health, housing, access, and opportunity context at the geography the source actually supports.", href: "/community-map", icon: Map, color: "#0891b2" },
    { label: "Tell the story", detail: "Source, vintage, limits, and lived knowledge stay visible instead of becoming a black-box score.", href: "/community-impact", icon: FileText, color: "#7c3aed" },
    { label: "Choose the tool", detail: "Implementation-science methods match the setting, stakeholders, readiness, and decision in front of you.", href: "/our-approach", icon: Target, color: "#e11d48" },
    { label: "Track learning", detail: "Actions, fidelity, corrections, and outcomes stay connected through the Chainweb loop.", href: "/impact", icon: Activity, color: "#059669" },
  ] as const;

  return (
    <section className="px-4 py-10 sm:px-6" data-testid="section-health-equity-first-glance">
      <div className="max-w-6xl mx-auto rounded-3xl border overflow-hidden" style={{ background: isDark ? "linear-gradient(135deg, rgba(8,47,73,0.75), rgba(30,27,75,0.8))" : "linear-gradient(135deg, #f0fdfa, #eef2ff)" }}>
        <div className="p-6 sm:p-9">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "#0891b2" }}>Health-equity mapping + data story</p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black tracking-tight" style={{ color: isDark ? "#fff" : "#0f172a" }}>
              See what is happening where an HBCU, nonprofit, or community partner serves.
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: isDark ? "rgba(248,250,252,0.78)" : "rgba(15,23,42,0.7)" }}>
              One place-aware workflow connects health equity, housing, opportunity, evidence, action, implementation, outcomes, and learning — with provenance and honest unavailable states at every step.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Link key={step.href} href={step.href}>
                  <div className="h-full rounded-2xl border p-4 transition-transform hover:-translate-y-1" style={{ background: isDark ? "rgba(15,23,42,0.62)" : "rgba(255,255,255,0.82)", borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)" }} data-testid={`health-equity-step-${index + 1}`}>
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${step.color}1c`, color: step.color }}><Icon className="h-5 w-5" /></span>
                      <ArrowRight className="h-4 w-4" style={{ color: step.color }} />
                    </div>
                    <h3 className="mt-4 font-bold" style={{ color: isDark ? "#fff" : "#0f172a" }}>{step.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: isDark ? "rgba(248,250,252,0.62)" : "rgba(15,23,42,0.62)" }}>{step.detail}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold" style={{ color: isDark ? "rgba(248,250,252,0.65)" : "rgba(15,23,42,0.62)" }}>
            <span>50 states · one architecture</span>
            <span>Place-level, not person-level risk scoring</span>
            <span>Evidence-to-action, not data theater</span>
            <Link href="/austin-community-bridge/deliverable" className="inline-flex items-center gap-1 hover:underline" data-testid="link-private-austin-preview">
              <Lock className="h-3 w-3" /> Private Austin review · staff sign-in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunityOperatingStory() {
  const stages = [
    {
      number: "01",
      title: "Observe the place",
      detail: "Start with a ZIP, city, county, or community question. Census and public data are matched to the geography the source actually supports.",
      icon: Map,
      color: "#0891b2",
    },
    {
      number: "02",
      title: "Tell the story",
      detail: "See the baseline, systems domains, comparisons, historical change, and possible future pathways — not just one isolated number.",
      icon: FileText,
      color: "#7c3aed",
    },
    {
      number: "03",
      title: "Connect evidence",
      detail: "Chainweb is ThriveUp's evidence map: it connects conditions, research, timing, and possible intervention windows.",
      icon: Network,
      color: "#e11d48",
    },
    {
      number: "04",
      title: "Act and learn",
      detail: "Nonprofits can choose a response, pursue funding, work with partners, track outcomes, and carry learning into the next cycle.",
      icon: Activity,
      color: "#059669",
    },
  ] as const;

  const truthTypes = [
    { label: "Observed", detail: "Published source data", color: "#0891b2" },
    { label: "Derived", detail: "TCAF calculations", color: "#7c3aed" },
    { label: "Modeled", detail: "Planning scenarios", color: "#d97706" },
    { label: "Implemented", detail: "Reach and outcomes", color: "#059669" },
  ] as const;

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-16" data-testid="section-community-operating-story">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8 lg:gap-12 items-start">
          <div>
            <Badge variant="secondary" className="mb-3">
              <Layers className="mr-1 h-3 w-3" /> One community story
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
              See the whole community story, then decide what to do next.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5">
              For people and organizations: ThriveUp keeps the story connected — what is happening, what may be connected, what evidence supports a response, and what changed after people acted. The community remains the protagonist; the platform is the backbone.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/community-impact" data-testid="button-story-community-impact">
                  See community impact <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href="/platform-overview.pdf" target="_blank" rel="noopener noreferrer" aria-label="Read the full platform briefing (opens in a new tab)" data-testid="button-story-platform-brief">
                  Read the full briefing <span className="text-[10px] text-muted-foreground">(opens in new tab)</span> <FileText className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {stages.map((stage) => {
              const Icon = stage.icon;
              return (
                <Card key={stage.number} className="p-4 h-full" data-testid={`card-story-stage-${stage.number}`}>
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black" style={{ color: stage.color, background: `${stage.color}18` }}>
                      {stage.number}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" style={{ color: stage.color }} />
                        <h3 className="font-bold text-sm">{stage.title}</h3>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{stage.detail}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border bg-slate-50/80 p-4 dark:bg-slate-900/50 sm:p-5" data-testid="story-truth-labels">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="shrink-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Evidence stays labeled</p>
              <p className="text-xs text-muted-foreground mt-1">AI summaries are synthesis, not a fifth measurement.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
              {truthTypes.map((truth) => (
                <div key={truth.label} className="rounded-xl border bg-background/70 px-3 py-2" data-testid={`story-truth-${truth.label.toLowerCase()}`}>
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: truth.color }} />
                    <span className="text-xs font-bold">{truth.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{truth.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
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
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "ThriveUp Academy — a TCAF platform",
        "url": "https://ai-mastery-academy.replit.app/",
           "description": "A global-by-design, local-first community infrastructure platform connecting people, evidence, services, and implementation support while keeping local availability and source limits visible.",
        "publisher": {
          "@type": "Organization",
          "name": "The Collaborative Advocate Foundation (TCAF)",
          "description": "A nonprofit backbone for residents, nonprofits, and communities to thrive.",
          "foundingLocation": { "@type": "Place", "name": "Pflugerville, TX" },
           "areaServed": "Global architecture; country-owned and locally adapted delivery"
        }
      }} />
      <style>{`
        @keyframes heroGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-ping,
          .animate-in {
            animation: none !important;
          }
          *, *::before, *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
        @media (min-width: 701px) {
          [data-testid="landing-page"] > section:not([data-testid="section-hero"]) {
            content-visibility: auto;
            contain-intrinsic-size: 560px;
          }
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
             TCAF + ThriveUp · Local first → global learning
          </div>

          {/* Headline */}
          <h1 className="font-black mb-5 tracking-tight leading-tight" data-testid="text-hero-title"
            style={{ fontSize: "clamp(2.2rem,5.5vw,3.75rem)", color: heroText, maxWidth: 740, textShadow: isDark ? "0 2px 40px rgba(5,8,16,0.9)" : "0 1px 24px rgba(255,255,255,0.8)" }}>
            Nobody should fall
            <br />
            <span style={{ background: "linear-gradient(90deg,#d97706 0%,#e11d48 55%,#7c3aed 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              through the cracks.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-3 px-2" data-testid="text-hero-subtitle"
            style={{ color: heroSub, fontSize: "1.05rem", maxWidth: 580, lineHeight: 1.65 }}>
             Free for people, organizations, and communities. Built to meet people where they are — in their place, language, and situation — then connect local action to shared learning across borders.
          </p>

          <p className="text-sm mb-3 px-2" data-testid="text-hero-mission"
            style={{ color: heroSub, maxWidth: 580, lineHeight: 1.65 }}>
             National community infrastructure: we connect people to benefits and grant funding, align services with workforce pathways, and measure what actually changes.{" "}
            <Link href="/why-thriveup" className="font-semibold hover:underline" style={{ color: "#d97706" }} data-testid="link-hero-why-thriveup">
              Why ThriveUp
            </Link>
          </p>

          <p className="text-sm mb-3 px-2" data-testid="text-hero-geography"
            style={{ color: heroMuted, maxWidth: 520, lineHeight: 1.65 }}>
             Start with a guided next step — for yourself, your family, your organization, or your community. Connected local availability varies by place.{" "}
            <Link href="/coverage" className="font-semibold hover:underline" style={{ color: "#d97706" }} data-testid="link-hero-coverage">
              See where we operate
            </Link>
            {" "}· account requirements vary by tool.
          </p>

          <p className="text-xs mb-5 px-2" data-testid="text-hero-identity"
            style={{ color: heroFaint, maxWidth: 560, lineHeight: 1.65 }}>
             {IDENTITY_STRAP} · Global architecture; local availability and evidence depth vary.
          </p>

          {/* The first decision is intentionally small and plain-language.
              Deeper ecosystem and research paths remain below the hero. */}
          <div className="w-full max-w-3xl mb-5" data-testid="hero-primary-actions">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] mb-3" style={{ color: heroMuted }}>
              Choose your next step
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
              <Link href="/get-help"
                className="min-h-12 rounded-xl px-4 py-3 flex items-center gap-2.5 font-semibold text-sm"
                style={{ background: "linear-gradient(135deg,#f59e0b,#e11d48)", color: "#fff", boxShadow: "0 0 28px rgba(245,158,11,0.28)" }}
                data-testid="button-hero-get-help">
                <Heart className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>I need help now</span>
                <ArrowRight className="h-4 w-4 ml-auto shrink-0" aria-hidden="true" />
              </Link>
              <Link href="/benefits-screener"
                className="min-h-12 rounded-xl px-4 py-3 flex items-center gap-2.5 font-semibold text-sm"
                style={{ ...secondaryBtn, backdropFilter: "blur(8px)" }}
                data-testid="button-hero-benefits">
                <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Check my benefits</span>
                <ArrowRight className="h-4 w-4 ml-auto shrink-0" aria-hidden="true" />
              </Link>
              <Link href="/hub"
                className="min-h-12 rounded-xl px-4 py-3 flex items-center gap-2.5 font-semibold text-sm"
                style={{ ...secondaryBtn, backdropFilter: "blur(8px)" }}
                data-testid="button-hero-serve">
                <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>I serve people or an organization</span>
                <ArrowRight className="h-4 w-4 ml-auto shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="w-full max-w-3xl mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs" data-testid="hero-stakeholder-doors">
            <span style={{ color: heroFaint }}>Also here for:</span>
            <Link href="/academy" className="inline-flex items-center gap-1.5 font-semibold hover:underline" style={{ color: heroSub }} data-testid="link-hero-students">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              Students &amp; job seekers
            </Link>
            <Link href="/chw-dashboard" className="inline-flex items-center gap-1.5 font-semibold hover:underline" style={{ color: heroSub }} data-testid="link-hero-case-managers">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Case managers &amp; CHWs
            </Link>
            <Link href="/ecosystem-story" className="inline-flex items-center gap-1.5 font-semibold hover:underline" style={{ color: heroSub }} data-testid="link-hero-funders">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              Funders &amp; evaluators
            </Link>
          </div>

          <p className="text-[11px] mt-3 px-2 max-w-2xl mx-auto" style={{ color: heroFaint }} data-testid="text-hero-safety-disclosure">
            Information and navigation support only — not an eligibility determination or medical advice. If someone is in immediate danger, call 911; for a mental-health crisis, call or text 988.
          </p>

          <div className="w-full max-w-3xl mb-6 rounded-2xl px-4 py-3 text-left sm:text-center"
            style={{ background: isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.7)", border: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.12)"}`, backdropFilter: "blur(10px)" }}
            data-testid="hero-health-equity-story">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] mb-1" style={{ color: "#0891b2" }}>
              Health-equity mapping + data story
            </div>
            <div className="text-sm font-semibold" style={{ color: heroText }}>
              Map the place <span className="mx-1" style={{ color: "#0891b2" }}>→</span>
              tell the story <span className="mx-1" style={{ color: "#7c3aed" }}>→</span>
              match the tool <span className="mx-1" style={{ color: "#e11d48" }}>→</span>
              track learning
            </div>
            <div className="text-xs mt-1" style={{ color: heroMuted }}>
              For the communities HBCUs, nonprofits, and trusted partners serve — with source, limits, and action ownership visible.
            </div>
          </div>

          {/* Live stat strip */}
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 pt-6"
            style={{ borderTop: `1px solid ${statBorder}` }}>
            <HeroStatCounter target={15}  label="Service Platforms"           color="#0891b2" isDark={isDark} />
            <HeroStatCounter target={9}   label="Benefit Programs Per Screen" color="#059669" isDark={isDark} />
            <HeroStatCounter target={50}  label="States — One Architecture"  color="#7c3aed" isDark={isDark} />
          </div>
        </div>
      </section>

      <HealthEquityFirstGlance isDark={isDark} />

      <GlobalLocalFrontDoor />

      {/* "Meet people where they are": self-identify FIRST, before any
          B2B/funding pitch. This must stay directly under the hero. */}
       <StartHere />

      {/* Cross-sector organizational front doors — six sectors, one backbone */}
      <CrossSectorDoors />

      <CommunityOperatingStory />

      <ServicePlatformSection />
       <PlatformPortfolio />

      {/* Three implementation modes: self-service, guided, TCAF-managed */}
      <ImplementationModes />

      {/* Live partner intelligence network — ChildCORE, Civic Signal, RPLICE, Census */}
      <PartnerNetworkSection />

      <GrantPathProSection />
      <FiveWTeaser />
      <TrustBar />
      <DisciplineStrip />

      {/* ── Platform Hubs + Quick Access ─────────────────────────────── */}
      <section className="px-4 pt-8 pb-4 sm:px-6" data-testid="section-platform-hubs">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 4 gateway tiles */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Platform Hubs
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "Serve People",  desc: "Benefits, Foster Youth, Justice, Health",     href: "/hub/serve",    icon: Heart,   bg: "from-emerald-500 to-teal-600" },
                { label: "Get Funded",    desc: "Grants, RFP tools, Win-rate analytics",        href: "/hub/fund",    icon: Target,  bg: "from-amber-500 to-orange-600" },
                { label: "Grow",          desc: "Trade Sims, Workforce, Academy, AI",           href: "/hub/grow",    icon: Rocket,  bg: "from-blue-600 to-indigo-700" },
                { label: "Connect",       desc: "Partners, Coalition, Impact, About",           href: "/hub/connect", icon: Network, bg: "from-teal-600 to-cyan-700" },
              ] as const).map(card => {
                const Icon = card.icon;
                return (
                  <Link key={card.href} href={card.href}>
                    <div
                      className={`relative rounded-2xl p-4 h-[120px] sm:h-[130px] flex flex-col justify-between cursor-pointer transition-all active:scale-[0.97] hover:scale-[1.02] shadow-sm bg-gradient-to-br ${card.bg}`}
                      data-testid={`gateway-card-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Icon className="w-7 h-7 text-white/90" />
                      <div>
                        <p className="text-white font-bold text-sm leading-snug">{card.label}</p>
                        <p className="text-white/65 text-[11px] mt-0.5 leading-snug">{card.desc}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Access icons */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Quick Access
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {([
                { label: "Sparky AI",    href: "/sparky",        icon: MessageCircle, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/40" },
                { label: "This Week",    href: "/this-week",     icon: Calendar,      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/40" },
                { label: "Navigator",    href: "/navigator",     icon: Compass,       color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" },
                { label: "Live Grants",  href: "/grants",        icon: Target,        color: "text-orange-600 bg-orange-100 dark:bg-orange-900/40" },
                { label: "Impact",       href: "/impact",        icon: TrendingUp,    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40" },
                { label: "Community",    href: "/community",     icon: Users,         color: "text-rose-600 bg-rose-100 dark:bg-rose-900/40" },
                { label: "Coverage Map", href: "/coverage",      icon: Map,           color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40" },
                { label: "Workbench",    href: "/workbench",     icon: Wrench,        color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40" },
              ] as const).map(tool => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.href} href={tool.href}>
                    <div
                      className="flex flex-col items-center gap-2 cursor-pointer w-16 flex-shrink-0"
                      data-testid={`quick-tool-${tool.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${tool.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground text-center leading-tight">
                        {tool.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Live metrics strip */}
          <div className="space-y-3">
            {/* Grant intelligence — plain language */}
            <Link href="/grants">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors" data-testid="metric-grant-intelligence">
                <Target className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 leading-snug">Live funding intelligence</p>
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 leading-snug mt-0.5">We track funding opportunities nationwide and intelligently align them to the community partners we serve.</p>
                </div>
              </div>
            </Link>

            {/* Four number stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { value: "15",  label: "Service Platforms",   color: "text-blue-600 dark:text-blue-400"     },
                { value: "9",   label: "Benefits Per Screen", color: "text-emerald-600 dark:text-emerald-400"},
                { value: "50",  label: "States — 1 Build",   color: "text-violet-600 dark:text-violet-400" },
                { value: "107", label: "Languages via AI translation", color: "text-rose-600 dark:text-rose-400" },
              ]).map(m => (
                <div key={m.label} className="bg-card border border-border/60 rounded-xl p-3 text-center" data-testid={`metric-${m.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section className="px-4 pb-4 sm:px-6 pt-8" data-testid="section-ctx-benefits-initiative">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/wab2-enrollment-hub"
            className="group block overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-card to-card transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] no-underline"
            data-testid="card-ctx-benefits-initiative"
            aria-label="CTX Benefits Initiative — health benefits enrollment for 5 Central Texas counties"
          >
            <div className="p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="rounded-xl p-3 bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0 shadow-md">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-2 text-xs" data-testid="badge-ctx-initiative">
                    CTX Benefits Initiative · 5-county Central Texas
                  </Badge>
                  <h3 className="font-bold text-lg sm:text-xl mb-2 leading-tight" data-testid="text-ctx-initiative-title">
                    Health benefits enrollment — powered by a CHW, not a website.
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed" data-testid="text-ctx-initiative-desc">
                    Travis · Williamson · Hays · Bastrop · Caldwell. Community health workers guide families through Medicaid, CHIP, MAP, and wraparound enrollment in a single session.
                    Not a directory. Not a screener. An enrollment <em>engine</em> — with real humans, real outcomes, and RPLICE intelligence behind every referral.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium shadow-sm" data-testid="button-ctx-initiative">
                      Start Enrollment
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-xs text-muted-foreground italic">Free · CHW-assisted · No immigration status collected</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="px-4 pb-4 sm:px-6 pt-8" data-testid="section-foster-youth-initiative">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/youth-rights"
            className="group block overflow-hidden rounded-xl border-2 border-rose-500/30 bg-gradient-to-br from-rose-500/5 via-card to-card transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] no-underline"
            data-testid="card-foster-youth-initiative"
            aria-label="Foster Youth & Transition Initiative — rights, funding, and career pathways for youth aging out of foster care"
          >
            <div className="p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="rounded-xl p-3 bg-gradient-to-br from-rose-500 to-pink-600 shrink-0 shadow-md">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-2 text-xs" data-testid="badge-foster-initiative">
                    Foster Youth &amp; Transition Initiative · Kansas pilot, 50-state architecture
                  </Badge>
                  <h3 className="font-bold text-lg sm:text-xl mb-2 leading-tight" data-testid="text-foster-initiative-title">
                    The right solution, at the right time, for the right young person.
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed" data-testid="text-foster-initiative-desc">
                    Federal rights with legal citations youth can show a principal. Chafee and ETV funding — up to $5,000/yr for training —
                    with an anonymous eligibility checker. Coordinated entry, youth-governed decisions, and a staff gap checklist so no one's
                    entitlements slip through. All bridged straight into trade sims, childcare careers, and workforce pathways on this platform.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-medium shadow-sm" data-testid="button-foster-initiative">
                      Know Your Rights
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-xs text-muted-foreground italic">Free · Anonymous · Citations included</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="px-4 pb-4 sm:px-6 pt-6" data-testid="section-community-data">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/community-data"
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/40 no-underline"
            data-testid="card-community-data"
              aria-label="Look up official homelessness data for your community — supported U.S. Continuums of Care, 2007 to present"
          >
            <div className="rounded-xl p-3 bg-gradient-to-br from-sky-500 to-blue-600 shrink-0 shadow-md">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight" data-testid="text-community-data-link-title">
                What does homelessness look like in your community?
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                 Official HUD counts for supported U.S. Continuums of Care and published years since 2007 — plus live, cited answers about local services. Nothing estimated.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
          </Link>
        </div>
      </section>

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
              <Button asChild variant="outline" className="gap-2" data-testid="button-talk-to-navigator">
                <Link href="/ai-companion"><Sparkles className="h-4 w-4" /> Talk to Someone Who Can Help</Link>
              </Button>
              <Button asChild variant="ghost" className="gap-2 text-muted-foreground" data-testid="button-email-us">
                <a href="mailto:president@thecollaborativeadvocate.org"><Mail className="h-4 w-4" /> Or email us directly</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

       <ImpactNumbers />
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

       <section className="py-8 px-4 sm:px-6 border-y bg-card" data-testid="section-ecosystem-directory-link">
         <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
           <div>
             <p className="font-semibold">Ready to explore beyond the featured pathways?</p>
             <p className="text-sm text-muted-foreground mt-1">Connected partners and staff can open the full operations directory.</p>
           </div>
            <Button asChild variant="outline" className="gap-2 shrink-0" data-testid="button-ecosystem-directory">
              <Link href="/ecosystem">Open ecosystem command center <Globe className="h-4 w-4" /></Link>
            </Button>
         </div>
       </section>
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
           <Button asChild size="lg" className="gap-2" data-testid="button-book-appointment">
             <a
               href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2O1JcnlDSXEidpWJKtc02RF37MRUytN66JNOkHDRxDParffIH6eSlbRe0DVXUbfpJwGFRp2bFG?gv=true"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="Book an Appointment (opens in a new tab)"
             >
               <Calendar className="h-4 w-4" />
               Book an Appointment
               <ExternalLink className="h-3.5 w-3.5" />
             </a>
           </Button>
          <p className="text-xs text-muted-foreground/70 mt-4">
             Opens in Google Calendar in a new tab · Free · No commitment
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 sm:py-10 sm:px-6 border-t bg-card" data-testid="footer-main">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-semibold" data-testid="text-footer-brand">TCAF + ThriveUp</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2" data-testid="text-footer-tagline">
                Free, integrated community infrastructure for people, organizations, and the communities they serve. TCAF provides the mission, facilitation, and optional implementation workforce. ThriveUp provides the connected platform, tools, data, and coordination backbone — available in any U.S. county.
              </p>
              <p className="text-xs text-muted-foreground/70" data-testid="text-footer-foundation">
                 <span className="font-medium text-foreground">TCAF:</span> EIN 41-3618003 · UEI KDDVD1FGLW35 · CAGE 209N1 · IRS-determined 501(c)(3) · SAM Active<br />
                 <span className="font-medium text-foreground">ISS LLC:</span> EIN 87-2795417 · UEI C7YDV3P8EHL7 · CAGE 9VKK3 · for-profit contracting entity · SAM Active
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
              <span>Free Platform</span>
              <span aria-hidden="true">&middot;</span>
              <span>FERPA Ready</span>
              <span aria-hidden="true">&middot;</span>
              <span>HIPAA-Aware Design</span>
              <span aria-hidden="true">&middot;</span>
              <span>SOC 2 Framework</span>
              <span aria-hidden="true">&middot;</span>
              <span>50-State Architecture</span>
            </div>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}

function GlobalLocalFrontDoor() {
  const doors = [
    {
      icon: Heart,
      title: "For people and families",
      body: "Start with a question, a need, or a place. Get plain-language navigation, local options, and a next step without needing to understand the whole system first.",
      action: "Find help near you",
      href: "/get-help",
      tone: "from-rose-500 to-orange-500",
    },
    {
      icon: Compass,
      title: "For local implementers",
      body: "Bring your community, language, service system, and priorities. Turn evidence into owned actions, referrals, measures, and learning without replacing local leadership.",
      action: "Open the implementation path",
      href: "/hub",
      tone: "from-violet-500 to-indigo-600",
    },
    {
      icon: Globe,
      title: "For evidence, funding, and policy",
      body: "Trace signals to sources, separate observed from derived and modeled information, diagnose implementation gaps, and see what changed before scaling.",
      action: "Review the evidence model",
      href: "/ecosystem-story",
      tone: "from-teal-500 to-cyan-600",
    },
  ] as const;

  return (
    <section className="py-12 px-4 sm:py-16 sm:px-6 bg-slate-950 text-white" data-testid="section-global-local-front-door">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-8">
          <Badge className="mb-3 bg-white/10 text-cyan-200 border-white/20">
            <Globe className="mr-1 h-3 w-3" /> Global by design · local by default
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-3" data-testid="text-global-local-heading">
            Everything is local and personal before it becomes global.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            ThriveUp is built to support the global effort without pretending to be a UN agency, an official SDG reporting system, or a replacement for country teams. RPLICE helps protect evidence integrity and implementation learning; local people and partners decide what action means where they are.
          </p>
          <p className="text-xs text-slate-400 mt-3">
            Choose a door first. The selected flow then asks for only the local context, language, access needs, and consent information that it can honestly use.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {doors.map((door) => (
            <Link key={door.href} href={door.href} className="group no-underline" data-testid={`card-global-door-${door.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              <Card className="h-full bg-white/[0.06] border-white/15 text-white p-5 transition-all hover:bg-white/[0.1] hover:border-white/30">
                <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center bg-gradient-to-br ${door.tone} mb-4`}>
                  <door.icon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-base mb-2">{door.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">{door.body}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-200">
                  {door.action} <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>Sense → Question → Understand → Diagnose → Decide → Act → Measure → Learn → Adapt</span>
          <Link href="/coverage" className="text-cyan-200 font-semibold hover:underline" data-testid="link-global-coverage">
            See coverage and availability <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
