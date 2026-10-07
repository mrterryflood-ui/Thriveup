import { useEffect } from "react";
import { Link } from "wouter";
import { JsonLd } from "@/components/json-ld";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap, Wrench, Wind, Flame, Car, Code, BookOpen,
  Compass, GraduationCap, Award, ArrowRight, Clock, DollarSign,
  CheckCircle2, Building2, Rocket, ScrollText, ChevronRight,
} from "lucide-react";
import {
  TRADE_PATHWAYS,
  LESSON_DAYS,
  MINUTES_PER_LESSON,
  type TradePathway,
} from "@/lib/trade-sims/pathways";
import { EvidenceSummary } from "@/components/evidence-label";

const ICONS: Record<TradePathway["iconKey"], typeof Zap> = {
  electrical: Zap,
  plumbing: Wrench,
  hvac: Wind,
  welding: Flame,
  automotive: Car,
  "software-engineering": Code,
};

// The four-stage retraining journey. Links go to real, shipping routes.
const JOURNEY = [
  {
    step: 1,
    icon: Compass,
    title: "Explore",
    body: "Pick a trade. See what it takes, how long, and the credential you're aiming at — before you commit a single day.",
    color: "from-sky-500 to-blue-600",
  },
  {
    step: 2,
    icon: GraduationCap,
    title: "Train",
    body: `Free. ${LESSON_DAYS} days, about ${MINUTES_PER_LESSON} minutes each, all in your browser. Build it, break it, fix it — a real simulator, not a quiz.`,
    color: "from-violet-500 to-purple-600",
  },
  {
    step: 3,
    icon: ScrollText,
    title: "Prove it",
    body: "Pass the Day-15 capstone. Your transcript and certificate become evidence of prior learning you can hand to a program or employer.",
    color: "from-amber-500 to-orange-600",
  },
  {
    step: 4,
    icon: Rocket,
    title: "Next step",
    body: "Walk your certificate into an apprenticeship intake, a community-college certificate, or a credential exam. The pathway is named up front.",
    color: "from-emerald-500 to-green-600",
  },
];

// schema.org EducationalOccupationalProgram — one program-list per trade,
// following the JsonLd pattern used on /safe-passage. Only authored,
// verifiable fields are populated.
const WORKFORCE_PATHWAYS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "ThriveUp Workforce Retraining Pathways",
  "description":
    "Free, in-browser skilled-trades retraining pathways: explore a trade, train for 15 days, prove it with a capstone transcript and certificate, and step into a named apprenticeship or credential.",
  "itemListElement": TRADE_PATHWAYS.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "EducationalOccupationalProgram",
      name: `${t.name} — Trade Sims (ThriveUp)`,
      description: t.tagline,
      provider: {
        "@type": "Organization",
        name: "ThriveUp",
        url: "https://ai-mastery-academy.replit.app/",
      },
      programPrerequisites: "None — free, open access, login optional",
      occupationalCategory: t.name,
      timeToComplete: `P${LESSON_DAYS}D`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      url: `https://ai-mastery-academy.replit.app/academy/trade-sims/${t.slug}`,
      educationalCredentialAwarded: t.earn,
    },
  })),
};

export default function WorkforcePathwaysPage() {
  useEffect(() => {
    document.title = "Workforce Pathways — Free skilled-trades retraining | ThriveUp";
    const desc = document.querySelector('meta[name="description"]');
    const content =
      "Retrain for a skilled trade for free. Explore a trade, train 15 days in your browser, earn a capstone certificate, and step into a named apprenticeship or credential — electrical, plumbing, HVAC, welding, automotive, and software engineering.";
    if (desc) desc.setAttribute("content", content);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      <JsonLd data={WORKFORCE_PATHWAYS_SCHEMA} />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6 text-center space-y-4">
        <Badge variant="secondary" className="mx-auto" data-testid="badge-workforce-free">
          Free · open access · retrain from your phone
        </Badge>
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
          data-testid="text-workforce-title"
        >
          Workforce Pathways
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-workforce-tagline">
          Retraining shouldn't be a maze. Here's the whole journey on one page:
          what it takes, how long, the credential you earn, and exactly what to
          do next.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 text-sm rounded-full border px-3 py-1 bg-background">
            <Clock className="h-4 w-4 text-primary" /> {LESSON_DAYS} days · ~{MINUTES_PER_LESSON} min/day
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm rounded-full border px-3 py-1 bg-background">
            <DollarSign className="h-4 w-4 text-primary" /> $0 — free
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm rounded-full border px-3 py-1 bg-background">
            <Award className="h-4 w-4 text-primary" /> Capstone certificate
          </span>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
          <Button asChild size="lg" data-testid="button-start-trade-sims">
            <Link href="/academy/trade-sims">
              Start free — pick a trade <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Journey stepper / timeline */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6" data-testid="text-journey-heading">
          Your retraining journey
        </h2>
        <ol className="relative grid gap-4 md:grid-cols-4">
          {/* connecting line on desktop */}
          <div
            className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500"
            aria-hidden="true"
          />
          {JOURNEY.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.step}
                className="relative flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-3 duration-500"
                style={{ animationDelay: `${s.step * 90}ms`, animationFillMode: "both" }}
                data-testid={`journey-step-${s.step}`}
              >
                <div
                  className={`z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${s.color} text-white shadow-lg transition-transform hover:scale-110`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {s.step}
                </div>
                <div className="text-base font-bold">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground px-1">{s.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Per-trade "What it takes" grid */}
      <section className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold" data-testid="text-trades-heading">
            What it takes — by trade
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Same commitment across every trade: {LESSON_DAYS} days, free, in your
            browser. What changes is the credential you're aiming at and who you
            hand your certificate to.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRADE_PATHWAYS.map((t) => {
            const Icon = ICONS[t.iconKey] ?? BookOpen;
            return (
              <Card
                key={t.slug}
                className="flex h-full flex-col hover-elevate"
                data-testid={`card-pathway-${t.slug}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg" data-testid={`text-pathway-name-${t.slug}`}>
                      {t.name}
                    </CardTitle>
                  </div>
                  <p className="pt-2 text-sm text-muted-foreground">{t.tagline}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" /> {LESSON_DAYS} days · ~{MINUTES_PER_LESSON} min
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <DollarSign className="h-3 w-3" /> Free
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Award className="h-4 w-4 text-amber-500" /> What you earn
                    </div>
                    <p className="mt-1 text-muted-foreground">{t.earn}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Building2 className="h-4 w-4 text-emerald-600" /> Next steps
                    </div>
                    <ul className="mt-1 space-y-1">
                      {t.nextSteps.map((ns) => (
                        <li key={ns} className="flex items-start gap-1.5 text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{ns}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto grid grid-cols-1 gap-2 pt-2">
                    <Button asChild size="sm" data-testid={`button-explore-${t.slug}`}>
                      <Link href={`/academy/trade-sims/${t.slug}`}>
                        Explore {t.name} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild size="sm" variant="outline" data-testid={`button-transcript-${t.slug}`}>
                        <Link href={`/academy/trade-sims/${t.slug}/transcript`}>
                          <ScrollText className="mr-1 h-3.5 w-3.5" /> Transcript
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" data-testid={`button-certify-${t.slug}`}>
                        <Link href={`/academy/trade-sims/${t.slug}/certify`}>
                          <Award className="mr-1 h-3.5 w-3.5" /> Certify
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <EvidenceSummary claims={[{ value: null, unit: "", source: "CareerOneStop Occupational Data (DOL)", sourceId: "careeronestop-occupational", asOfDate: null, geographyKey: null, confidence: "verified", decisionCaption: "Career pathway information supports exploration, not an employment guarantee." }]} />

        <p className="text-center text-xs text-muted-foreground max-w-2xl mx-auto pt-2">
          Credential names and next-step programs shown above are drawn from each
          trade's authored curriculum. Direct-hire and contractor referral
          pathways are added only as partnerships are confirmed in writing.
        </p>
      </section>

      {/* Coordinated next-doors — existing workforce surfaces */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-4" data-testid="text-coordinate-heading">
          Keep the momentum going
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/academy/careers", icon: Compass, label: "Career Explorer", body: "Not sure which trade fits? Explore careers first." },
            { href: "/apprenticeship-tracker", icon: Wrench, label: "Apprenticeship Tracker", body: "Track your apprenticeship applications and hours." },
            { href: "/mentorship-directory", icon: GraduationCap, label: "Mentors & Pathways", body: "Connect with a mentor who's walked the path." },
            { href: "/workforce-employers", icon: Building2, label: "Employer Connections", body: "See employers connected to the workforce network." },
            { href: "/workforce-pell", icon: DollarSign, label: "Workforce Pell Grant", body: "Explore funding for longer-form training." },
            { href: "/academy/pathway", icon: Rocket, label: "My Pathway", body: "Your saved plan and progress." },
          ].map((d) => {
            const Icon = d.icon;
            return (
              <Link key={d.href} href={d.href}>
                <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-next-${d.href.replace(/[^a-z0-9]+/gi, "-")}`}>
                  <CardContent className="flex items-start gap-3 pt-5">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 font-semibold">
                        {d.label} <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">{d.body}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-12 text-center">
        <Button asChild size="lg" data-testid="button-cta-start">
          <Link href="/academy/trade-sims">
            Pick a trade and start today <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
