import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, MessageCircle, ArrowRight, ShieldCheck, Globe,
  Rocket, Heart, Mic, Users, TrendingUp, HandHeart, FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { CommunityVoiceProject } from "@shared/schema";

interface ProjectsResponse {
  projects: CommunityVoiceProject[];
}

const WHO_WE_LISTEN_TO = [
  "Grandmothers and aunties who are the childcare system — no license, full house",
  "Formerly incarcerated workers navigating re-entry without a roadmap",
  "Promotoras who have been doing community health work for a decade without a title",
  "Foster youth aging out of a system that stopped watching",
  "Mixed-status families who need benefits their children qualify for",
  "Night-shift semiconductor workers with no childcare when the sun goes down",
  "Rural families two counties from the nearest social service office",
  "Peer mentors holding spaces no program has a budget line for",
];

const PIPELINE = [
  { icon: Mic, label: "You speak", sub: "On your terms. In your language. No account. No license check.", color: "text-rose-500" },
  { icon: Heart, label: "We witness", sub: "Your contribution is logged, attributed to you, never shared without your permission.", color: "text-violet-500" },
  { icon: TrendingUp, label: "Evidence builds", sub: "Pins cluster into themes. Themes become data. Data becomes the ground truth that systems can't ignore.", color: "text-sky-500" },
  { icon: Users, label: "Coalition acts", sub: "Partners, CHWs, and navigators respond to what the community actually said — not what an intake form captured.", color: "text-amber-500" },
  { icon: FileText, label: "Funding follows", sub: "Themes ship directly into grant narrative. Funders see your words — with your consent — as primary-source evidence.", color: "text-green-600" },
];

export default function VoiceIndexPage() {
  const { data, isLoading } = useQuery<ProjectsResponse>({
    queryKey: ["/api/voice/projects"],
  });
  const { isAuthenticated } = useAuth();
  const projects = data?.projects ?? [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-10" data-testid="page-voice-index">

      {/* Hero */}
      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-rose-700 text-white text-[10px] uppercase tracking-wider">Community Voice</Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-rose-400 text-rose-700">Primary Source</Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight" data-testid="text-page-title">
          The people closest to the problem<br />
          <span className="text-muted-foreground font-normal">are closest to the solution.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Every data point on this platform starts with a person. Census numbers tell us the gap.
          Community voices tell us why it exists and what would actually close it.
          This is where those voices live — and where they go to work.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button asChild data-testid="button-add-voice-hero">
            <Link href="/voice/north-wilco-childcare-gaps">
              <Mic className="h-4 w-4 mr-1.5" /> Add your voice — North Wilco
            </Link>
          </Button>
          {isAuthenticated && (
            <Button variant="outline" asChild data-testid="button-start-project">
              <Link href="/voice/new">
                <Rocket className="h-4 w-4 mr-1" /> Start a listening project
              </Link>
            </Button>
          )}
        </div>
      </header>

      <Separator />

      {/* Who we listen to */}
      <section data-testid="section-who-we-listen-to">
        <h2 className="text-lg font-bold mb-1">We listen to people that systems usually don't.</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Not because their experiences are edge cases — because they're the center. These are the people
          who know where the gaps are, because they're living in them.
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {WHO_WE_LISTEN_TO.map((who) => (
            <div
              key={who}
              className="flex items-start gap-2 rounded-lg border border-rose-100 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 px-3 py-2.5"
              data-testid="item-who"
            >
              <Heart className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />
              <span className="text-sm">{who}</span>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* The pipeline */}
      <section data-testid="section-pipeline">
        <h2 className="text-lg font-bold mb-1">What happens to your voice.</h2>
        <p className="text-sm text-muted-foreground mb-5">
           ITI-linked contributions are never used for aggregate insight without explicit consent.
           Ordinary public pins are labeled community-submitted aggregate input. Every ITI step is visible and reversible.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3">
          {PIPELINE.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex flex-col items-start gap-2" data-testid={`pipeline-step-${i + 1}`}>
                <div className="flex items-center gap-2">
                  {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground hidden md:block" />}
                  <div className={`rounded-full p-2 bg-slate-100 dark:bg-slate-800`}>
                    <Icon className={`h-4 w-4 ${step.color}`} />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-sm">{step.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* Safety and access */}
      <section className="grid sm:grid-cols-3 gap-3" data-testid="section-safety-access">
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Safe by default</p>
                <p className="text-xs text-muted-foreground mt-1">
                   Crisis signals are flagged for project safety review. No external notification is sent automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Language-aware</p>
                <p className="text-xs text-muted-foreground mt-1">
                   Language support varies by selected locale. Translation and English mirrors are only available where the selected flow provides them.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <HandHeart className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">8 layered consents</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All default OFF. You choose: anonymized sharing, funder citation, public naming, data aggregation. Each is separate. Each is yours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Active listening projects */}
      <section data-testid="section-projects">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold">Active listening projects</h2>
            <p className="text-sm text-muted-foreground">Each project is a question a community is asking about itself.</p>
          </div>
          {isAuthenticated && (
            <Button size="sm" variant="outline" asChild data-testid="button-new-project-section">
              <Link href="/voice/new">
                <Rocket className="h-3.5 w-3.5 mr-1" /> Start a project
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-44" />)}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground" data-testid="empty-voice-projects">
              No public projects yet. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Link key={p.id} href={`/voice/${p.slug}`} data-testid={`link-voice-project-${p.slug}`}>
                <Card className="cursor-pointer hover-elevate active-elevate-2 transition-shadow h-full">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                          <h3 className="font-semibold text-base truncate" data-testid={`text-voice-name-${p.slug}`}>{p.name}</h3>
                        </div>
                        {p.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {p.accessMode === "public" ? "Open to all" : p.accessMode === "email" ? "Email required" : "Hybrid"}
                          </Badge>
                          {p.crisisRoutingEnabled && (
                            <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-400">Crisis review flag</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {(p.pinCategories ?? []).length} categories
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Closing statement */}
      <section className="rounded-xl border-2 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 p-6 space-y-3" data-testid="section-closing">
        <div className="font-bold text-lg text-rose-800 dark:text-rose-300">
          Your voice is not input to a system. It is the source of one.
        </div>
        <p className="text-sm text-rose-800 dark:text-rose-300 max-w-2xl">
          Every grant we write, every coalition we convene, every CHW we deploy is directed by what
          community members have said — in this platform, in the field, and in the years of relationships
          that preceded it. This is not consultation. It is co-authorship.
        </p>
        <div className="flex gap-3 flex-wrap pt-1">
          <Button className="bg-rose-700 hover:bg-rose-800 text-white" asChild data-testid="button-contribute-footer">
            <Link href="/voice/north-wilco-childcare-gaps">
              <Mic className="h-4 w-4 mr-1.5" /> Contribute your voice
            </Link>
          </Button>
          <Button variant="outline" className="border-rose-400 text-rose-800 dark:text-rose-300" asChild data-testid="button-our-approach-footer">
            <Link href="/our-approach">
              <Heart className="h-4 w-4 mr-1" /> Our approach
            </Link>
          </Button>
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-400">
          No account required · No license check · Language support varies by locale · Crisis review flag · 8 layered consents, all default OFF
        </p>
      </section>

      {/* Technical footnote */}
      <p className="text-xs text-muted-foreground">
        Built on TCAF's GIS + census + health stack, Talk Your Talk language substrate, Whole-Person Health safety floor,
        and Civic Signal civic-intelligence layer.
      </p>
    </div>
  );
}
