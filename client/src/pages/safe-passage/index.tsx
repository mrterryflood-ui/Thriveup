import { useState } from "react";
import { Link } from "wouter";
import { JsonLd } from "@/components/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, Home, DollarSign, Scale, Briefcase, Users, BarChart3,
  Phone, MessageSquare, ExternalLink, AlertTriangle, Heart,
  ArrowRight, Building2, HandHeart, Globe, ChevronRight,
} from "lucide-react";

function QuickExit() {
  return (
    <button
      onClick={() => { window.location.replace("https://www.weather.com"); }}
      className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-1.5"
      data-testid="button-quick-exit"
      title="Quickly leave this page"
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      Quick Exit
    </button>
  );
}

const TOOLS = [
  {
    href: "/safe-passage/safety-planning",
    icon: Shield,
    color: "from-violet-500 to-purple-600",
    label: "Safety Planning",
    description: "Build a personal safety plan — step by step. Download and keep it.",
    who: "For survivors",
    testId: "card-tool-safety-planning",
  },
  {
    href: "/safe-passage/housing-assessment",
    icon: Home,
    color: "from-teal-500 to-emerald-600",
    label: "Where Do I Start?",
    description: "Answer 5 questions to find the right next step for your situation.",
    who: "For survivors",
    testId: "card-tool-housing-assessment",
  },
  {
    href: "/safe-passage/benefits-bridge",
    icon: DollarSign,
    color: "from-amber-500 to-orange-500",
    label: "Benefits & Financial Help",
    description: "Find money, housing aid, and benefits specifically for survivors — including programs most people don't know exist.",
    who: "For survivors",
    testId: "card-tool-benefits-bridge",
  },
  {
    href: "/safe-passage/housing-finder",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    label: "Find Transitional Housing",
    description: "Search available transitional housing units by location, children, accessibility, and more.",
    who: "For survivors",
    testId: "card-tool-housing-finder",
  },
  {
    href: "/safe-passage/legal-navigator",
    icon: Scale,
    color: "from-rose-500 to-pink-600",
    label: "Your Legal Rights",
    description: "Break your lease. Get a protective order. Protect your immigration status. Know your rights.",
    who: "For survivors",
    testId: "card-tool-legal-navigator",
  },
  {
    href: "/safe-passage/employment-pathway",
    icon: Briefcase,
    color: "from-emerald-500 to-green-600",
    label: "Employment & Financial Independence",
    description: "Job search, resume gaps, childcare, DV-friendly employers, and financial safety.",
    who: "For survivors",
    testId: "card-tool-employment",
  },
  {
    href: "/safe-passage/peer-mentor",
    icon: HandHeart,
    color: "from-fuchsia-500 to-pink-500",
    label: "Connect with a Peer Mentor",
    description: "Coming soon — a peer mentor program is in development. Until it launches, the confidential hotlines above connect you to a trained advocate right now.",
    who: "For survivors",
    badge: "Coming soon",
    comingSoon: true,
    testId: "card-tool-peer-mentor",
  },
  {
    href: "/safe-passage/partner-portal",
    icon: Users,
    color: "from-slate-500 to-gray-600",
    label: "Partner Organization Portal",
    description: "Submit housing listings, authorize vouchers, log services, and view your impact data.",
    who: "For partner orgs",
    testId: "card-tool-partner-portal",
  },
];

const CRISIS = [
  { label: "National DV Hotline", contact: "1-800-799-7233", sub: "Call or text 24/7", href: "tel:18007997233", icon: Phone },
  { label: "Text Line", contact: "Text START to 88788", sub: "If calling isn't safe", href: "sms:88788", icon: MessageSquare },
  { label: "Crisis Chat", contact: "thehotline.org", sub: "Private online chat", href: "https://www.thehotline.org", icon: Globe },
  { label: "SAFE Austin Hotline", contact: "512-267-7233", sub: "Travis County 24/7", href: "tel:5122677233", icon: Heart },
];

const STATS = [
  { value: "1 in 4", label: "women in Texas experience severe intimate partner violence" },
  { value: "~40%", label: "of Austin's homeless women are fleeing domestic violence" },
  { value: "3,238", label: "individuals experiencing homelessness in Austin (PIT 2025)" },
  { value: "0", label: "statutory match requirement — OVW funds are available" },
];

const SAFE_PASSAGE_SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Safe Passage — Domestic Violence & Safety Support",
  "description": "Confidential resources and support for survivors of domestic violence and unsafe situations — safety planning, housing resources, legal aid, employment support, and connections to local shelters and advocates.",
  "provider": {
    "@type": "Organization",
    "name": "ThriveUp Academy",
    "url": "https://ai-mastery-academy.replit.app/"
  },
  "serviceType": "Domestic Violence Support & Safety Resources",
  "areaServed": "United States",
  "audience": {
    "@type": "Audience",
    "audienceType": "Survivors of domestic violence and unsafe situations"
  },
  "url": "https://ai-mastery-academy.replit.app/safe-passage"
};

export default function SafePassageLandingPage() {
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-950 dark:to-teal-950/20">
      <JsonLd data={SAFE_PASSAGE_SERVICE_SCHEMA} />
      <QuickExit />

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-12 pb-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-full px-4 py-1.5 text-sm text-teal-700 dark:text-teal-300 mb-4">
            <Shield className="h-3.5 w-3.5" />
            <span>Part of LifeBridge — ThriveUp Academy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-3">
            Safe Passage
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Housing, benefits, legal rights, and employment support for survivors of domestic violence, dating violence, sexual assault, and stalking.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            No account required · Confidential · Available in 89 languages
          </p>
        </div>

        {/* Crisis bar */}
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4 mb-8">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wide mb-3 text-center">
            If you are in immediate danger, call 911. Confidential support available 24/7:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CRISIS.map(c => (
              <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2.5 bg-white dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors text-center"
                data-testid={`link-crisis-${c.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <c.icon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-200">{c.label}</span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400">{c.contact}</span>
                <span className="text-[10px] text-slate-500">{c.sub}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Tools grid */}
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Tools & Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {TOOLS.map(tool => {
            const cardInner = (
              <Card className={`h-full transition-all border-slate-200 dark:border-slate-700 group ${tool.comingSoon ? "opacity-80 cursor-default" : "hover:shadow-md cursor-pointer hover:border-teal-300 dark:hover:border-teal-700"}`}
                data-testid={tool.testId}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}>
                      <tool.icon className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex items-center gap-2">
                      {tool.badge && <Badge variant="outline" className="text-[10px]">{tool.badge}</Badge>}
                      <Badge variant="secondary" className="text-[10px]">{tool.who}</Badge>
                    </div>
                  </div>
                  <h3 className={`font-semibold text-slate-900 dark:text-slate-100 mb-1 transition-colors ${tool.comingSoon ? "" : "group-hover:text-teal-700 dark:group-hover:text-teal-300"}`}>
                    {tool.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tool.description}</p>
                  {tool.comingSoon ? (
                    <a
                      href="mailto:info@thriveupacademy.org?subject=Safe%20Passage%20Peer%20Mentor%20interest"
                      className="inline-flex items-center gap-1 mt-3 text-teal-600 dark:text-teal-400 text-xs font-medium underline"
                      data-testid="link-peer-mentor-interest"
                    >
                      <span>Email us to hear when it launches</span>
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-1 mt-3 text-teal-600 dark:text-teal-400 text-xs font-medium">
                      <span>Open tool</span>
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
            if (tool.comingSoon) {
              return <div key={tool.href}>{cardInner}</div>;
            }
            return <Link key={tool.href} href={tool.href}>{cardInner}</Link>;
          })}
        </div>

        {/* Impact / stats toggle */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-8">
          <button
            onClick={() => setShowStats(s => !s)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-left"
            data-testid="button-toggle-stats"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">Why this matters — Austin DV data</span>
            </div>
            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showStats ? "rotate-90" : ""}`} />
          </button>
          {showStats && (
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900/20">
              {STATS.map(s => (
                <div key={s.value} className="text-center">
                  <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{s.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mission statement */}
        <div className="border border-teal-200 dark:border-teal-800 rounded-xl p-6 bg-teal-50/50 dark:bg-teal-950/20 mb-6">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-2 leading-snug">
            ThriveUp Academy connects people to the tools they need — to support themselves, their families, and their communities.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            We work across our own platform and alongside partner organizations, because no one thrives alone. When individuals are informed, advocates are equipped, and organizations are linked — the whole community grows stronger. Safe Passage is built on that foundation.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Collaboration", "Advocacy", "Education", "Information", "Communication"].map(pillar => (
              <span key={pillar} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700">
                {pillar}
              </span>
            ))}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 italic">
              makes us all stronger together
            </span>
          </div>
        </div>

        {/* For partners */}
        <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-6 text-white mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-teal-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">For Shelter and Service Organizations</h3>
              <p className="text-sm text-slate-300 mb-3">
                Submit your transitional housing listings, authorize voucher payments, log services delivered, and access your impact data — all in one place. Free to join.
              </p>
              <Link href="/safe-passage/partner-portal">
                <Button size="sm" variant="outline" className="border-teal-500 text-teal-300 hover:bg-teal-500/10" data-testid="button-partner-portal">
                  Partner Portal <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* LifeBridge connection */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 pb-8">
          <p>Safe Passage is a program of <Link href="/"><span className="underline cursor-pointer">ThriveUp Academy</span></Link> · Part of the <Link href="/austin"><span className="underline cursor-pointer">Austin Housing Initiative</span></Link></p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <ExternalLink className="h-3 w-3" />
            <a href="https://www.thehotline.org" target="_blank" rel="noopener noreferrer" className="underline">National DV Hotline</a> · 
            <a href="https://safeaustin.org" target="_blank" rel="noopener noreferrer" className="underline"> SAFE Alliance Austin</a> · 
            <a href="https://www.oag.texas.gov/crime-victims" target="_blank" rel="noopener noreferrer" className="underline"> TX Crime Victims' Compensation</a>
          </p>
        </div>
      </div>
    </div>
  );
}
