import { useEffect, useState } from "react";
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
  Wrench, ChevronDown, Mail,
  Map, Microscope, Layers
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
    <Link href={pathway.href}>
      <a
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
      </a>
    </Link>
  );
}

function TrustBar() {
  return (
    <div className="py-6 px-4 text-center" data-testid="section-trust-bar">
      <div className="max-w-5xl mx-auto">
        <p className="text-sm text-muted-foreground mb-3">
          <strong>The Collaborative Advocate Foundation</strong> (EIN 41-3618003) is a 501(c)(3) nonprofit, veteran-founded and Black-led, headquartered in Pflugerville, TX. Led by Dr. Terry Flood, DHA/DBA.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-501c3">
            <Shield className="mr-1 h-3 w-3" /> 501(c)(3) Nonprofit
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-vosb">
            <Shield className="mr-1 h-3 w-3" /> Veteran-Owned
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-wcag">
            <Shield className="mr-1 h-3 w-3" /> WCAG 2.1 AA
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-trust-coppa">
            <Shield className="mr-1 h-3 w-3" /> COPPA Compliant
          </Badge>
        </div>
      </div>
    </div>
  );
}

function ImpactNumbers() {
  return (
    <section className="py-10 px-4 bg-card" data-testid="section-impact-numbers">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: "6", label: "Service Domains" },
            { value: "24", label: "Connected Platforms" },
            { value: "4", label: "AI Engines" },
            { value: "20", label: "TEKS Standards Covered" },
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
            Real people in real communities — youth, veterans, returning citizens, and the organizations that champion them. We don't just provide services. We build the infrastructure so communities can lead their own transformation.
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
      desc: "We don't parachute in and leave. We equip churches, nonprofits, schools, and local organizations with the tools to run their own workforce programs, track their own outcomes, and sustain their own impact — long after the grant ends.",
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
            Not promises — infrastructure. Not handouts — credentials. Not programs that end when funding does — systems that communities own and sustain.
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
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">From community insight to measurable outcomes.</p>
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
              <h2 className="text-2xl font-bold mb-2">24 Platforms, One Living System</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                We are problem solvers using collaborative accountability and transparency that is data-led and intentional — to make good programs better and leave no one behind.
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

export default function LandingPage() {
  const { toast } = useToast();
  const searchString = useSearch();

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

  return (
    <div className="min-h-screen" data-testid="landing-page">
      <style>{`
        @keyframes heroGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <section className="relative overflow-hidden" data-testid="section-hero">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 via-white to-white dark:from-violet-950/30 dark:via-background dark:to-background" />
        <div className="relative mx-auto max-w-3xl text-center px-4 pt-12 pb-6 sm:pt-16 sm:pb-8 md:pt-20">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">The Collaborative Advocate Foundation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-[1.15]" data-testid="text-hero-title">
            Empowering communities<br />
            <span className="text-primary">to build their own futures.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-4 px-2 leading-relaxed" data-testid="text-hero-subtitle">
            We equip youth, veterans, returning citizens, families, and the organizations that champion them — with AI-powered training, verifiable credentials, and the infrastructure to create lasting change from within.
          </p>
          <p className="text-sm text-muted-foreground/70 max-w-lg mx-auto px-2 mb-4" data-testid="text-hero-geography">
            Empowering Pflugerville, Manor, East Austin, and communities across Central Texas. Veteran-founded. Black-led. Built by people who've been where you are.
          </p>
          <p className="text-xs text-muted-foreground/60 max-w-2xl mx-auto px-2 leading-relaxed" data-testid="text-hero-identity">
            ThriveUp is the community infrastructure platform — the operating system that empowers communities to coordinate workforce training, health equity, education, and case management across 6 domains, 24 platforms, and 4-engine AI.
          </p>
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
              <a href="mailto:mr.terryflood@gmail.com">
                <Button variant="ghost" className="gap-2 text-muted-foreground" data-testid="button-email-us">
                  <Mail className="h-4 w-4" /> Or email us directly
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <TrustBar />
      <ImpactNumbers />
      <CommunitiesWeServe />
      <WhatWeDeliver />
      <HowItWorks />
      <SuccessStories />
      <DeepDiveSection />

      <footer className="py-8 px-4 sm:py-10 sm:px-6 border-t bg-card" data-testid="footer-main">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-semibold" data-testid="text-footer-brand">ThriveUp Academy</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2" data-testid="text-footer-tagline">
                Empowering youth, veterans, returning citizens, families, and the organizations that champion them — with AI-powered workforce development and community infrastructure across Central Texas and beyond.
              </p>
              <p className="text-xs text-muted-foreground/70" data-testid="text-footer-foundation">
                The Collaborative Advocate Foundation 501(c)(3)
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
                <li><Link href="/ecosystem" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-ecosystem">Ecosystem Map</Link></li>
                <li><Link href="/outcomes" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-outcomes">Outcome Reports</Link></li>
                <li><Link href="/rplice-tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-rplice">Research Tools</Link></li>
              </ul>
            </div>
            <div data-testid="footer-column-contact">
              <h4 className="font-semibold text-sm mb-2">Contact</h4>
              <ul className="space-y-1.5">
                <li>
                  <a href="mailto:mr.terryflood@gmail.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5" data-testid="link-footer-email">
                    <Mail className="h-3 w-3" /> mr.terryflood@gmail.com
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
