import { Link } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { JURISDICTIONS } from "@shared/nationwide/jurisdictions";
import { COUNTIES_BY_STATE } from "@shared/nationwide/counties";
import {
  MapPin, Heart, Mail, ArrowRight, CheckCircle2, Sparkles,
  Map as MapIcon, Building2, Users, Globe,
} from "lucide-react";

// Texas is the FIRST county-deployment, not the whole product. The pilot is a 5-county region
// in Central Texas funded through the St. David's We All Benefit 2.0 LOI.
const ACTIVE_DEPLOYMENT = {
  state: "TX",
  stateName: "Texas",
  programName: "St. David's We All Benefit 2.0",
  status: "Active pilot",
  startDate: "April 2026",
  counties: [
    { name: "Travis County", seat: "Austin", note: "State capital, urban core" },
    { name: "Williamson County", seat: "Round Rock", note: "Fast-growing suburbs north of Austin" },
    { name: "Hays County", seat: "San Marcos", note: "San Marcos / Kyle / Buda corridor" },
    { name: "Bastrop County", seat: "Bastrop", note: "Rural east of Austin" },
    { name: "Caldwell County", seat: "Lockhart", note: "Rural southeast of Austin" },
  ],
};

function StateTile({ usps, name, isActive }: { usps: string; name: string; isActive: boolean }) {
  const countyCount = COUNTIES_BY_STATE[usps]?.length ?? 0;
  return (
    <Card
      className={`text-left ${
        isActive
          ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 ring-1 ring-amber-300"
          : "hover-elevate"
      }`}
      data-testid={`tile-state-${usps}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {countyCount > 0 ? `${countyCount} counties` : "Territory"}
            </p>
          </div>
          {isActive ? (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white shrink-0">
              <Sparkles className="h-3 w-3 mr-1" /> Active
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0 text-muted-foreground">
              Ready
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CoveragePage() {
  // If the URL has #request, scroll to that section after mount.
  useEffect(() => {
    if (window.location.hash === "#request") {
      requestAnimationFrame(() => {
        document.getElementById("request")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  // Sort jurisdictions alphabetically, but pin Texas to the front so the active deployment is visible without scrolling.
  const sorted = [...JURISDICTIONS].sort((a, b) => {
    if (a.code === "TX") return -1;
    if (b.code === "TX") return 1;
    return a.name.localeCompare(b.name);
  });
  const totalCounties = Object.values(COUNTIES_BY_STATE).reduce((sum, list) => sum + list.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-amber-50/20 dark:from-slate-950/40 dark:via-background dark:to-amber-950/10" data-testid="coverage-page">
      <title>Coverage — Where TCAF deploys | ThriveUp Academy</title>
      <meta
        name="description"
        content="ThriveUp Academy is a nationwide AI operating system for community-based organizations. Deployed today in Central Texas through the St. David's pilot. Available to launch in every U.S. county."
      />

      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        {/* HERO */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-3 text-sm px-3 py-1" data-testid="badge-coverage-hero">
            <MapIcon className="h-3.5 w-3.5 mr-1.5" /> Built nationwide. Texas first.
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight" data-testid="text-coverage-title">
            Where we operate
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ThriveUp Academy is the same platform in every U.S. county — wired into local Census data,
            local benefits, and local partners. Today we're activating Central Texas with the St. David's
            Foundation. Your county can be next.
          </p>
        </div>

        {/* TOP-LEVEL STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <Card data-testid="stat-states-ready">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-3xl font-bold">{JURISDICTIONS.length}</p>
              <p className="text-xs text-muted-foreground mt-1">States &amp; territories ready</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-counties-ready">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-3xl font-bold">{totalCounties.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">U.S. counties analyzable</p>
            </CardContent>
          </Card>
          <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" data-testid="stat-active-counties">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{ACTIVE_DEPLOYMENT.counties.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Counties live in Texas pilot</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-pipeline">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-3xl font-bold">2026</p>
              <p className="text-xs text-muted-foreground mt-1">Year 1 of nationwide rollout</p>
            </CardContent>
          </Card>
        </div>

        {/* ACTIVE DEPLOYMENT — TEXAS */}
        <section className="mb-12" data-testid="section-active-deployment">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl md:text-2xl font-bold">Active deployment</h2>
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" /> Live now
            </Badge>
          </div>

          <Card className="border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-50 via-orange-50/50 to-white dark:from-amber-950/30 dark:via-orange-950/20 dark:to-background">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-amber-600" /> Central Texas — 5 counties
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Funded through the {ACTIVE_DEPLOYMENT.programName} pool · {ACTIVE_DEPLOYMENT.startDate} launch
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">
                  Texas (TX)
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ACTIVE_DEPLOYMENT.counties.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/70 dark:bg-background/40 border"
                    data-testid={`card-pilot-county-${c.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        County seat: <span className="font-medium">{c.seat}</span> · {c.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/sdoh-explorer">
                  <Button variant="default" size="sm" className="gap-2 w-full sm:w-auto" data-testid="button-explore-pilot-data">
                    <Globe className="h-4 w-4" /> Explore pilot county data
                  </Button>
                </Link>
                <Link href="/wab2-enrollment-hub">
                  <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" data-testid="button-pilot-program">
                    <Heart className="h-4 w-4" /> See the pilot program
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* NATIONAL COVERAGE GRID */}
        <section className="mb-12" data-testid="section-national-coverage">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Ready to deploy in every state</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Same platform, same playbook — wired into the right local data wherever your community is.
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" /> {JURISDICTIONS.length} jurisdictions
            </Badge>
          </div>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
            data-testid="grid-states"
          >
            {sorted.map((j) => (
              <StateTile key={j.code} usps={j.code} name={j.name} isActive={j.code === ACTIVE_DEPLOYMENT.state} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            "Ready" means our nationwide data layer (Census ACS, federal program eligibility, county
            geography) is wired in for that state today. Adding active services — local CHWs, clinics,
            employers, justice partners — happens through county-by-county pilots like the one in Texas.
          </p>
        </section>

        {/* REQUEST DEPLOYMENT */}
        <section id="request" className="scroll-mt-20" data-testid="section-request">
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-violet-50 via-white to-indigo-50/30 dark:from-violet-950/30 dark:via-background dark:to-indigo-950/20">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Bring TCAF to your county</CardTitle>
              </div>
              <CardDescription className="text-base">
                If you run a coalition, foundation, ISD, county health authority, or workforce board —
                we can stand up a county pilot in your region. The platform is the same. The
                partnerships and local data are yours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border bg-background" data-testid="card-step-conversation">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</div>
                    <p className="font-semibold text-sm">A real conversation</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    30 minutes. We listen. You tell us what your community already does well and where it stalls.
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-background" data-testid="card-step-fit">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</div>
                    <p className="font-semibold text-sm">Local-fit assessment</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We pull live county data and show you what a deployment would look like for your area — for free, in writing.
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-background" data-testid="card-step-launch">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</div>
                    <p className="font-semibold text-sm">Co-design &amp; launch</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We build the local pilot together — with your CHWs, your clinics, your ISDs, your justice partners.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Founder-led: every first conversation is with Dr. Terry Flood directly.
                  </span>
                </div>
                <a href="mailto:president@thecollaborativeadvocate.org?subject=Bring%20TCAF%20to%20our%20county">
                  <Button size="lg" className="gap-2" data-testid="button-request-deployment">
                    <Mail className="h-4 w-4" /> Start a conversation
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </section>

        <p className="text-center text-xs text-muted-foreground mt-8">
          The Collaborative Advocate Foundation · 501(c)(3) · Veteran-founded · Black-led
        </p>
      </div>
    </div>
  );
}
