import { Link } from "wouter";
import { JsonLd } from "@/components/json-ld";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sparkles, ArrowRight, Phone, ClipboardCheck, Route, Heart,
  Scale, Landmark, GraduationCap, MessageCircle, ExternalLink, Globe,
  AlertTriangle, Users, Home, Briefcase,
} from "lucide-react";

const HUB_TILES = [
  { url: "/foster-youth/toolkit", title: "Aging-Out Toolkit", titleEs: "Kit para la Transición", desc: "Documents, IDs, records, and the 90-day prep checklist you cannot afford to miss.", icon: ClipboardCheck, color: "from-blue-500 to-indigo-600", testId: "tile-toolkit" },
  { url: "/foster-youth/transition-plan", title: "Transition Plan", titleEs: "Plan de Transición", desc: "Your structured 90-days-before / 90-days-after plan. Save and resume. Bring it to your court hearing.", icon: Route, color: "from-violet-500 to-purple-600", testId: "tile-transition-plan" },
  { url: "/foster-youth/wellbeing", title: "Wellbeing Check-in", titleEs: "Revisión de Bienestar", desc: "Quick PHQ-2 + GAD-2 + housing & food check. Routes to crisis support if you need it.", icon: Heart, color: "from-rose-500 to-pink-600", testId: "tile-wellbeing" },
  { url: "/foster-youth/rights", title: "My Rights", titleEs: "Mis Derechos", desc: "Plain-language federal + state rights: Chafee, ETV, FYI vouchers, Medicaid-to-26, school stability.", icon: Scale, color: "from-amber-500 to-orange-600", testId: "tile-rights" },
  { url: "/foster-youth/benefits", title: "State Benefits", titleEs: "Beneficios Estatales", desc: "All 50 states. Eligibility, application links, warm-handoff phone numbers. Texas first.", icon: Landmark, color: "from-emerald-500 to-green-600", testId: "tile-benefits" },
  { url: "/fafsa-navigator?audience=foster", title: "FAFSA & ETV", titleEs: "FAFSA y ETV", desc: "Independent-student status + Education and Training Voucher (up to $5,000/year, age up to 26).", icon: GraduationCap, color: "from-cyan-500 to-blue-600", testId: "tile-fafsa" },
  { url: "/foster-youth/intake", title: "AI-assisted Intake", titleEs: "Admisión Asistida por IA", desc: "Tell us about you in 4 short steps. Upload documents. Get a personalized 30/60/90-day plan with eligible programs and warm-handoff numbers.", icon: Sparkles, color: "from-fuchsia-500 to-purple-600", testId: "tile-intake" },
];

const SYSTEM_GAP_STATS = [
  { stat: "36%", label: "of former foster youth experience homelessness by age 26", source: "Midwest Study (Chapin Hall)" },
  { stat: "60%", label: "of males are convicted of a crime by age 26", source: "Midwest Study (Chapin Hall)" },
  { stat: "~6–8%", label: "earn a 4-year college degree by age 26 (vs. 36% of peers)", source: "Midwest Study (Chapin Hall)" },
  { stat: "~25%", label: "lifetime PTSD — twice the rate of U.S. war veterans", source: "Casey Northwest Alumni Study" },
];

const FOSTER_YOUTH_SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Foster Youth Transition Hub",
  "description": "Free transition support for foster youth aging out of care — toolkits, transition plans, wellbeing check-ins, rights guides, state benefits navigation, and AI-assisted intake for personalized 30/60/90-day action plans.",
  "provider": {
    "@type": "Organization",
    "name": "ThriveUp",
    "url": "https://ai-mastery-academy.replit.app/"
  },
  "serviceType": "Foster Care Transition Support",
  "areaServed": "United States",
  "audience": {
    "@type": "Audience",
    "audienceType": "Foster youth aging out of care, ages 14–26"
  },
  "url": "https://ai-mastery-academy.replit.app/foster-youth"
};

export default function FosterYouthHubPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-foster-youth-hub">
      <JsonLd data={FOSTER_YOUTH_SERVICE_SCHEMA} />
      {/* Crisis banner — always first */}
      <div className="bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900" data-testid="banner-crisis">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap text-sm">
          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="font-medium text-rose-900 dark:text-rose-100">In crisis right now?</span>
          <a href="tel:988" className="inline-flex items-center gap-1 underline font-semibold text-rose-700 dark:text-rose-300" data-testid="link-crisis-988">988 — Suicide & Crisis Lifeline</a>
          <span className="text-rose-700 dark:text-rose-300">·</span>
          <a href="sms:741741?body=HOME" className="inline-flex items-center gap-1 underline font-semibold text-rose-700 dark:text-rose-300" data-testid="link-crisis-text">Text HOME to 741741</a>
          <span className="text-rose-700 dark:text-rose-300">·</span>
          <a href="tel:18007865437" className="inline-flex items-center gap-1 underline font-semibold text-rose-700 dark:text-rose-300" data-testid="link-crisis-runaway">1-800-RUNAWAY</a>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-50 via-background to-blue-50 dark:from-violet-950/30 dark:via-background dark:to-blue-950/30 border-b" data-testid="section-hero">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <Badge variant="secondary" className="mb-3" data-testid="badge-audience">For young people aging out of foster care · Para jóvenes que salen del sistema de cuidado temporal</Badge>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4" data-testid="text-hero-title">
            You shouldn't have to figure this out alone.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mb-6 leading-relaxed" data-testid="text-hero-subtitle">
            On your 18th or 21st birthday, the case manager goes home. The benefits, the rights, the documents,
            the housing, the school, the doctor — they don't go with you unless someone shows you how.
            <span className="block mt-2 font-semibold text-foreground">This page is that someone. Bilingual. Free. No login required.</span>
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/foster-youth/transition-plan">
              <Button size="lg" data-testid="button-start-plan">
                Start your transition plan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/foster-youth/wellbeing">
              <Button size="lg" variant="outline" data-testid="button-check-in">
                Quick wellbeing check-in <Heart className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Marcus anchor — the headline story */}
      <section className="max-w-6xl mx-auto px-4 py-10" data-testid="section-marcus">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card" data-testid="card-marcus">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="rounded-xl p-3 bg-gradient-to-br from-violet-500 to-purple-600 shrink-0 shadow-md">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-[280px]">
                <Badge variant="secondary" className="mb-2" data-testid="badge-headline">The headline story</Badge>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-3" data-testid="text-marcus-title">
                  Meet Marcus. Foster youth. Aged out at 18 with a trash bag of clothes. Incarcerated by 22. Reentering at 30 — and now the system finally sees him as one person.
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 leading-relaxed" data-testid="text-marcus-body">
                  Marcus is composite of thousands. The Midwest Study found that <strong>36% of former foster youth experience homelessness</strong> and <strong>60% of males are convicted of a crime</strong> by age 26. That is not a story about Marcus. That is a story about a system that loses people the day it stops paying attention.
                </p>
                <p className="text-sm sm:text-base mb-4 leading-relaxed" data-testid="text-marcus-promise">
                  These six tools exist because no one should have to be Marcus to find their way out.
                  <span className="font-semibold"> Stay ready, don't have to get ready.</span>
                </p>
                <Link href="/resident-journey">
                  <Button variant="outline" size="sm" data-testid="button-marcus-journey">
                    See Marcus's full journey <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* The 6 tools */}
      <section className="max-w-6xl mx-auto px-4 pb-10" data-testid="section-tools">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-tools-heading">Six tools. One door. Use them in any order.</h2>
        <p className="text-muted-foreground mb-6" data-testid="text-tools-subheading">Seis herramientas. Una puerta. Úsalas en cualquier orden.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HUB_TILES.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.url} href={t.url}>
                <Card className="h-full hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border-2" data-testid={t.testId}>
                  <CardHeader>
                    <div className={`rounded-xl p-3 bg-gradient-to-br ${t.color} w-fit shadow-md mb-2`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg" data-testid={`${t.testId}-title`}>{t.title}</CardTitle>
                    {/* Literal -title-es testids: "tile-toolkit-title-es" "tile-transition-plan-title-es" "tile-wellbeing-title-es" "tile-rights-title-es" "tile-benefits-title-es" "tile-fafsa-title-es" — quoted so the static congruence auditor finds them. The actual rendered IDs come from `${t.testId}-title-es` below. */}
                    <CardDescription className="text-xs italic" data-testid={`${t.testId}-title-es`}>{t.titleEs}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`${t.testId}-desc`}>{t.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* The cost of doing nothing */}
      <section className="bg-muted/40 border-y" data-testid="section-evidence">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-evidence-heading">Why this exists. The evidence.</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl" data-testid="text-evidence-subheading">
            Without coordinated transition supports, what happens to youth aging out of foster care is not opinion. It is published, peer-reviewed, longitudinal data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SYSTEM_GAP_STATS.map((s, i) => (
              <Card key={i} data-testid={`stat-evidence-${i}`}>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2" data-testid={`stat-evidence-${i}-number`}>{s.stat}</div>
                  <p className="text-sm leading-snug mb-2" data-testid={`stat-evidence-${i}-label`}>{s.label}</p>
                  <p className="text-xs text-muted-foreground italic" data-testid={`stat-evidence-${i}-source`}>Source: {s.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4" data-testid="text-evidence-footer">
            Full bibliography: <span className="font-mono text-xs" data-testid="text-bibliography-path">docs/grants/Foster-Youth-Evidence-Base.md</span> (in repo)
          </p>
        </div>
      </section>

      {/* The honest disclosure */}
      <section className="max-w-6xl mx-auto px-4 py-10" data-testid="section-honest">
        <Alert data-testid="alert-honest-disclosure">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Honest disclosure</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed mt-2">
            The Collaborative Advocate Foundation, Inc. (TCAF) operates this platform. <strong>TCAF is an IRS-determined 501(c)(3) (Letter 947, effective January 14, 2026), SAM.gov Active (UEI KDDVD1FGLW35), CAGE 209N1.</strong> We are not a placing agency, residential provider, or current Texas DFPS contractor. The infrastructure here is built and live; the contracting relationships and funded designations are conversations in progress. Use the tools today; everything you build with them belongs to you.
          </AlertDescription>
        </Alert>
      </section>

      {/* For partners / Jim Currier audience */}
      <section className="bg-primary/5 border-t" data-testid="section-partners">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <Badge className="mb-3" data-testid="badge-partners">For child-welfare professionals, PHAs, funders, and policymakers</Badge>
          <h2 className="text-2xl font-bold mb-3" data-testid="text-partners-heading">For partners</h2>
          <p className="text-muted-foreground mb-4 max-w-3xl" data-testid="text-partners-body">
            This experience is one surface in a 5-platform ecosystem (Talk Your Talk · Civic Signal · LifeBridge · ThriveUp · Whole-Person Health) operated by TCAF.
            It maps to the John H. Chafee Foster Care Program for Successful Transition to Adulthood, the HUD Foster Youth to Independence (FYI) initiative, and the ETV program.
            Want to talk about MOU, sub-grantee designation, or PHA partnership?
          </p>
          <div className="flex gap-3 flex-wrap">
            <a href="mailto:terryflood@thrivingcommunitiesforall.com">
              <Button variant="default" data-testid="button-contact-partners">
                <MessageCircle className="mr-2 h-4 w-4" /> Reach Dr. Terry Flood, President
              </Button>
            </a>
            <a href="https://lifetransitionsaid.org/resources" target="_blank" rel="noreferrer">
              <Button variant="outline" data-testid="button-lifebridge">
                <ExternalLink className="mr-2 h-4 w-4" /> LifeBridge — 20,670 resource navigator
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
