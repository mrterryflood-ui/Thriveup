import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Compass, Map, Building2, Lightbulb, Crown,
  BookOpen, Users, Award, Brain, Sparkles,
  ArrowRight, ChevronRight, Shield, Target, Zap,
  Heart, Calculator, Microscope, Globe, Salad,
  GraduationCap, MapPin, Languages, Laptop, Mail,
  Play,
  Briefcase, TrendingUp, HandshakeIcon, BarChart3,
  DollarSign, School, Factory, CheckCircle2, ClipboardList,
  Wrench, UserCheck, Link2, Quote, Search,
  Hammer, Cpu, Stethoscope, HardHat, Scale, CircleDot, RefreshCw, Repeat,
  Layers, MapPinned
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import { LEVEL_COLORS } from "@/lib/curriculum-data";
import { MISSION_STATEMENT, VISION_STATEMENT, VALUES, DISCIPLINES, MAPGAP_CYCLE, PROGRAM_SHOWCASES } from "@/lib/mvv-content";

const levelIcons = [Compass, Map, Building2, Lightbulb, Crown];

const levels = [
  { id: 1, title: "AI Explorer", track: "Foundation", desc: "Discovery & basics" },
  { id: 2, title: "AI Guide", track: "Foundation", desc: "Prompting & creative applications" },
  { id: 3, title: "AI Architect", track: "Intermediate", desc: "Building & ethics deepening" },
  { id: 4, title: "AI Innovator", track: "Advanced", desc: "Advanced creation & societal impact" },
  { id: 5, title: "AI Master", track: "Professional", desc: "Leadership & teaching others" },
];

const subjectAreas = [
  { name: "ELA", icon: BookOpen, color: "from-rose-500 to-pink-600", desc: "Reading, writing, and language arts across all grade levels" },
  { name: "Mathematics", icon: Calculator, color: "from-blue-500 to-indigo-600", desc: "Number sense, problem solving, and mathematical thinking" },
  { name: "Science", icon: Microscope, color: "from-emerald-500 to-teal-600", desc: "Observation, experiments, and understanding our world" },
  { name: "Social Studies", icon: Globe, color: "from-amber-500 to-orange-600", desc: "Community, history, geography, and civic understanding" },
  { name: "Social-Emotional Learning", icon: Heart, color: "from-pink-500 to-rose-600", desc: "Self-awareness, empathy, kindness, and healthy relationships" },
  { name: "Wellness & Self-Care", icon: Salad, color: "from-teal-500 to-cyan-600", desc: "Physical health, mindfulness, nutrition, and personal growth" },
];

const features = [
  {
    icon: Map,
    title: "Community Intelligence",
    desc: "GIS-powered maps layering health, crime, poverty, and resource data so you see exactly where gaps exist and what communities need.",
  },
  {
    icon: Target,
    title: "Grant Discovery Engine",
    desc: "Find federal, state, and private grants with AI-powered alignment scoring that shows exactly how your capabilities match each opportunity.",
  },
  {
    icon: Briefcase,
    title: "Workforce Pipeline",
    desc: "Complete lifecycle from intake assessment through training, credential attainment, job placement, retention tracking, and career advancement.",
  },
  {
    icon: Shield,
    title: "Reentry & Case Management",
    desc: "Evidence-based reentry plans, milestone tracking, service delivery records, and outcome reporting aligned to DOJ and WIOA standards.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Tools",
    desc: "10 professional-grade AI tools for building presentations, resumes, business plans, and portfolios — available to participants at every level.",
  },
  {
    icon: HandshakeIcon,
    title: "Partner Ecosystem",
    desc: "Connect churches, employers, law enforcement, schools, and community organizations into a coordinated service delivery network.",
  },
];


function ProgramShowcase() {
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  return (
    <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-program-showcase">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10 sm:mb-14">
          <Badge variant="secondary" className="mb-4">
            <MapPinned className="mr-1 h-3 w-3" /> Programs in Action
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-showcase-heading">
            Same Ecosystem, Different Communities
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            We don't copy-paste programs. MAP-GAP adapts through the Three Realities — what research says, what politics allow, what works on the ground. Here's how it looks in practice.
          </p>
        </div>
        <div className="space-y-4">
          {PROGRAM_SHOWCASES.map((prog) => {
            const isExpanded = expandedProgram === prog.id;
            return (
              <Card key={prog.id} className="overflow-hidden" data-testid={`card-program-${prog.id}`}>
                <button
                  className="w-full p-5 sm:p-6 text-left flex items-start gap-4 hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedProgram(isExpanded ? null : prog.id)}
                  data-testid={`button-toggle-program-${prog.id}`}
                >
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0 mt-0.5">
                    <MapPinned className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-base">{prog.title}</h3>
                      <Badge variant="outline" className="text-xs">{prog.location}</Badge>
                    </div>
                    <p className="text-sm font-medium text-primary">{prog.problem}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{prog.problemDesc}</p>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Disciplines Activated</h4>
                        <div className="space-y-2">
                          {prog.interventions.map((intv) => (
                            <div key={intv.discipline} className="text-xs sm:text-sm">
                              <span className="font-semibold">{intv.discipline}:</span>{" "}
                              <span className="text-muted-foreground">{intv.action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Stakeholders Coordinated</h4>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {prog.stakeholders.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Platforms Activated</h4>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {prog.platforms.map((p) => (
                            <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Grant Alignment</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {prog.grants.map((g) => (
                            <Badge key={g} variant="outline" className="text-xs border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">{g}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Expected Outcomes</p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{prog.outcomes}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const heroGradientStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #7c3aed, #9333ea, #6366f1, #7c3aed)",
  backgroundSize: "300% 300%",
  animation: "heroGradientShift 12s ease infinite",
};

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
    <div className="min-h-screen">
      <style>{`
        @keyframes heroGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {/* Hero */}
      <section className="relative overflow-hidden py-14 px-4 sm:py-24 sm:px-6 md:py-36">
        <div className="absolute inset-0" style={heroGradientStyle} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-4 sm:mb-6 bg-white/15 text-white border-white/20 text-xs sm:text-sm">
            4 Disciplines. 20 Platforms. One Living System.
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-tight" data-testid="text-hero-title">
            We Plan. We Coordinate.<br />We Build. We Measure.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-3 sm:mb-4 px-2" data-testid="text-hero-subtitle">
            We build with the precision of engineers, the rigor of scientists, the compassion of community health workers, and the coordination of seasoned program managers — with transparency woven into every decision, communication, and evaluation.
          </p>
          <p className="text-xs sm:text-sm md:text-base text-white/60 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Powered by implementation science, criminal justice research, HR management, and I-O psychology — MAP-GAP turns academic research into working technology and sustained community impact. We don't propose. We execute with fidelity and measure every step.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 px-4">
            {DISCIPLINES.map((d) => (
              <span key={d.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white/90 text-xs sm:text-sm border border-white/20 backdrop-blur-sm">
                {d.name}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Link href="/ecosystem">
              <Button size="lg" className="bg-white text-violet-700 border-white font-semibold shadow-lg w-full sm:w-auto min-h-[44px]" data-testid="button-see-ecosystem">
                <Layers className="mr-2 h-5 w-5" />
                See the Ecosystem
              </Button>
            </Link>
            <Link href="/grants">
              <Button size="lg" variant="outline" className="text-white border-white/40 backdrop-blur-sm bg-white/15 w-full sm:w-auto min-h-[44px]" data-testid="button-discover-grants">
                <Search className="mr-2 h-5 w-5" />
                Discover Grants
              </Button>
            </Link>
            <Link href="/impact">
              <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10 w-full sm:w-auto min-h-[44px]" data-testid="button-view-impact-dashboard">
                <BarChart3 className="mr-2 h-5 w-5" />
                View Impact
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Values */}
      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card" data-testid="section-mission-vision-values">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <Heart className="mr-1 h-3 w-3" /> The Collaborative Advocate Foundation
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-mvv-heading">
              Our Mission, Vision & Values
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              501(c)(3) Nonprofit &middot; Veteran-Owned Small Business (VOSB)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Card className="p-6 sm:p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold" data-testid="text-mission-label">Our Mission</h3>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed" data-testid="text-mission-statement">
                {MISSION_STATEMENT}
              </p>
            </Card>

            <Card className="p-6 sm:p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold" data-testid="text-vision-label">Our Vision</h3>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed" data-testid="text-vision-statement">
                {VISION_STATEMENT}
              </p>
            </Card>
          </div>

          <div>
            <div className="text-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold" data-testid="text-values-label">Our Values</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {VALUES.map((value) => {
                const iconMap: Record<string, typeof Heart> = { Heart, Microscope, Users, Globe, Shield, BarChart3, BookOpen, Scale, Briefcase, Brain };
                const Icon = iconMap[value.iconName] || Heart;
                return (
                  <Card key={value.title} className="p-5 hover-elevate" data-testid={`card-value-${value.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-2 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{value.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* MAP-GAP: The Operating System */}
      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-mapgap-cycle">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <RefreshCw className="mr-1 h-3 w-3" /> The MAP-GAP Operating System
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-mapgap-heading">
              How It Works: Ways, Ends, Means
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              MAP-GAP is the living, agnostic operating system that brings homeostasis to community transformation. Nothing happens in a black box — every step is transparent, measurable, and adaptive.
            </p>
          </div>

          <Card className="p-6 sm:p-8 mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" data-testid="card-mapgap-flow">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm">
              <span className="px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold">Academic Research</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ChevronRight className="h-4 w-4 text-muted-foreground sm:hidden" />
              <span className="px-3 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 font-semibold">MAP-GAP Translation</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ChevronRight className="h-4 w-4 text-muted-foreground sm:hidden" />
              <span className="px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold">Platform Technology</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ChevronRight className="h-4 w-4 text-muted-foreground sm:hidden" />
              <span className="px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold">Community Impact</span>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MAPGAP_CYCLE.map((step) => {
              const stepIcons = [Search, Target, Users, CheckCircle2, BarChart3, Repeat];
              const StepIcon = stepIcons[step.step - 1] || CircleDot;
              return (
                <Card key={step.step} className="p-5 hover-elevate" data-testid={`card-mapgap-step-${step.step}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
                      <StepIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">Step {step.step}</span>
                      </div>
                      <h3 className="font-semibold text-sm">{step.title}</h3>
                      <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {step.disciplines.map((dId) => {
                      const disc = DISCIPLINES.find(dd => dd.id === dId);
                      return disc ? (
                        <span key={dId} className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${disc.color}`}>
                          {disc.shortName}
                        </span>
                      ) : null;
                    })}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link href="/mapgap-framework">
              <Button variant="outline" size="lg" data-testid="button-mapgap-deep-dive">
                <BookOpen className="mr-2 h-4 w-4" />
                Explore the Full MAP-GAP Framework
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Six Interdisciplinary Disciplines → MAP-GAP Components */}
      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card" data-testid="section-disciplines-ip">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <Microscope className="mr-1 h-3 w-3" /> Proprietary Intellectual Property
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-disciplines-heading">
              Interdisciplinary Foundation, One Ecosystem
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Six academic disciplines map directly to MAP-GAP components — ensuring every platform in the ecosystem is grounded in rigorous research, not guesswork. Communities see themselves in the data and drive their own transformation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {DISCIPLINES.map((d) => {
              const dIconMap: Record<string, typeof Heart> = { Microscope, Scale, Briefcase, Brain, GraduationCap, Users };
              const DIcon = dIconMap[d.icon] || Microscope;
              return (
                <Card key={d.id} className={`p-6 border-2 ${d.borderColor}`} data-testid={`card-discipline-${d.id}`}>
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`rounded-md p-2.5 shrink-0 ${d.color}`}>
                      <DIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{d.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{d.desc}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-semibold text-primary mb-1">MAP-GAP Component:</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{d.mapGapComponent}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Program Showcase — Ways, Ends, Means */}
      <ProgramShowcase />

      {/* Original Features */}
      <section className="py-12 px-4 sm:py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-philosophy-heading">
              Platform Capabilities
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-2">
              Grant discovery, workforce development, case management, and community coordination — all powered by six interdisciplinary disciplines through MAP-GAP.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 hover-elevate">
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid={`text-feature-${feature.title.toLowerCase().replace(/\s/g, '-')}`}>
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subject Areas */}
      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <Heart className="mr-1 h-3 w-3" /> 6 Core Learning Areas
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-subjects-heading">
              Whole-Person Development
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-2">
              Academic foundations, career readiness, and personal wellness — every dimension of growth matters for workforce success at every stage of life.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {subjectAreas.map((subject) => (
              <Link key={subject.name} href="/subjects">
                <Card className="p-5 hover-elevate cursor-pointer group h-full" data-testid={`card-subject-${subject.name.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className="flex items-start gap-4">
                    <div className={`rounded-md p-2.5 bg-gradient-to-br ${subject.color} shrink-0`}>
                      <subject.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{subject.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Curriculum Levels */}
      <section className="py-12 px-4 sm:py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <Brain className="mr-1 h-3 w-3" /> Digital Literacy & AI Skills
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-levels-heading">
              From Explorer to Master
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-2">
              A five-level AI and digital literacy curriculum for all ages — from foundational skills to professional mastery, with grade-band modules for school settings.
            </p>
          </div>
          <div className="space-y-3">
            {levels.map((level, i) => {
              const Icon = levelIcons[i];
              const colors = LEVEL_COLORS[level.id];
              return (
                <Link key={level.id} href={`/curriculum/${level.id}`}>
                  <Card className="p-4 sm:p-5 hover-elevate cursor-pointer group" data-testid={`card-level-${level.id}`}>
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                      <div className={`rounded-md p-2.5 bg-gradient-to-br ${colors.gradient} shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-[150px] sm:min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base">Level {level.id}: {level.title}</h3>
                          <Badge variant="outline" className="text-xs">{level.track}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{level.desc}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Spark AI Companion CTA */}
      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <Card className="p-6 sm:p-8 md:p-12 bg-gradient-to-br from-violet-600 to-indigo-700 border-none text-white">
            <div className="text-center">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4 text-white/80" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">Meet Spark, Your AI Companion</h2>
              <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed mb-6 px-2">
                An empathetic AI companion that understands your situation and meets you where you are. Whether you are a returning citizen, a veteran, a parent, a case manager, or a community leader — Spark adapts its tone with professional coaching for adults and encouraging mentorship for younger learners.
              </p>
              <Link href="/ai-companion">
                <Button size="lg" className="bg-white text-violet-700 border-white/80 min-h-[44px]" data-testid="button-meet-navigator">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Talk to the Navigator
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Austin Community Access */}
      <section className="py-12 px-4 sm:py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <MapPin className="mr-1 h-3 w-3" /> Deployable Anywhere
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-austin-heading">
              Equity-First, Community-Driven
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-2">
              Deploy in any community, anywhere in the nation. Local ambassadors on the ground, removing every barrier to workforce development for under-resourced communities of all ages.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Heart, title: "Open Access", desc: "Free access for participants referred through community partners, courts, workforce agencies, and faith-based organizations" },
              { icon: Globe, title: "Any Community", desc: "GIS-powered community profiles auto-populate local data — deploy in any zip code and the platform adapts to that community's needs" },
              { icon: Languages, title: "Bilingual Support", desc: "Full English and Spanish language support with culturally relevant content for diverse communities" },
            ].map((item) => (
              <Card key={item.title} className="p-5 hover-elevate" data-testid={`card-community-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6 sm:mt-8">
            <Link href="/resources">
              <Button variant="outline" className="min-h-[44px]" data-testid="button-find-community-resources">
                Find Community Resources
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 px-4 sm:py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            {[
              { value: "50+", label: "Career Pathways" },
              { value: "All Ages", label: "Served" },
              { value: "50", label: "States Deployable" },
              { value: "10", label: "AI-Powered Tools" },
            ].map((stat) => (
              <div key={stat.label} className="py-2">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stakeholder Audience Sections */}
      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <Users className="mr-1 h-3 w-3" /> Built for Every Stakeholder
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-stakeholders-heading">
              Who We Serve
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-2">
              One platform that speaks every stakeholder's language — funders see outcomes, partners see coordination, participants see opportunity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

            <Card className="p-6 flex flex-col" data-testid="card-stakeholder-funders" aria-label="For Grant Makers and Funders">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg" data-testid="text-stakeholder-funders-heading">
                  For Grant Makers & Funders
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed flex-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Platform aligns to WIOA, DOJ, DOL, OJJDP, HHS, and private foundation grant criteria with transparent reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Outcome tracking across all major categories: recidivism, employment, education, housing, and behavioral health</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Scalable delivery model with community-level data proving need and documenting impact</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/outcomes">
                  <Button variant="outline" className="w-full min-h-[44px]" data-testid="button-stakeholder-funders-cta" aria-label="View outcome reporting for funders">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Outcome Reports
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 flex flex-col" data-testid="card-stakeholder-community" aria-label="For Community Organizations and Churches">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg" data-testid="text-stakeholder-community-heading">
                  For Community & Faith-Based Orgs
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed flex-1">
                <li className="flex items-start gap-2">
                  <HandshakeIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Become a local delivery partner — host programs, coordinate volunteers, and track community impact</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>See your community's data: health indicators, employment gaps, food access, and service availability</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Refer participants, track service delivery, and demonstrate collective impact to funders</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/partners">
                  <Button variant="outline" className="w-full min-h-[44px]" data-testid="button-stakeholder-community-cta" aria-label="Learn about community partnerships">
                    <HandshakeIcon className="mr-2 h-4 w-4" />
                    Become a Partner
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 flex flex-col" data-testid="card-stakeholder-justice" aria-label="For Justice System and Law Enforcement">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg" data-testid="text-stakeholder-justice-heading">
                  For Justice & Law Enforcement
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed flex-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Diversion referrals, reentry case management, and supervision compliance tracking in one system</span>
                </li>
                <li className="flex items-start gap-2">
                  <ClipboardList className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Evidence-based reentry plans with milestone tracking, risk assessment, and progress reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Measurable recidivism reduction through coordinated community services and workforce placement</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/justice-partners">
                  <Button variant="outline" className="w-full min-h-[44px]" data-testid="button-stakeholder-justice-cta" aria-label="Learn about justice system integration">
                    <Shield className="mr-2 h-4 w-4" />
                    Justice Integration
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 flex flex-col" data-testid="card-stakeholder-employers" aria-label="For Employers and Workforce Partners">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                  <Factory className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg" data-testid="text-stakeholder-employers-heading">
                  For Employers & Workforce
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed flex-1">
                <li className="flex items-start gap-2">
                  <UserCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Access trained, workforce-ready participants with verified credentials and professional skills</span>
                </li>
                <li className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Fair chance hiring support, placement tracking, and retention monitoring at 30/90/180/365 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Employer tax credits, wage subsidies, and workforce development grant eligibility documentation</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/academy/careers">
                  <Button variant="outline" className="w-full min-h-[44px]" data-testid="button-stakeholder-employers-cta" aria-label="Explore employer partnership opportunities">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Partner With Us
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 flex flex-col" data-testid="card-stakeholder-schools" aria-label="For Schools and Education Partners">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                  <School className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg" data-testid="text-stakeholder-schools-heading">
                  For Schools & Education
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed flex-1">
                <li className="flex items-start gap-2">
                  <ClipboardList className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Digital literacy and AI curriculum aligned to state standards with teacher dashboards and analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Wrench className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>GED preparation, literacy programs, and workforce readiness pathways for adult learners</span>
                </li>
                <li className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>School-to-career pipelines connecting classrooms directly to employer hiring commitments</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/academy/integration">
                  <Button variant="outline" className="w-full min-h-[44px]" data-testid="button-stakeholder-schools-cta" aria-label="Explore school integration options">
                    <School className="mr-2 h-4 w-4" />
                    Explore Integration
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 flex flex-col" data-testid="card-stakeholder-participants" aria-label="For Participants and Families">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg" data-testid="text-stakeholder-participants-heading">
                  For Participants & Families
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed flex-1">
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>AI navigator that understands your situation and connects you to housing, jobs, training, and support services</span>
                </li>
                <li className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Free AI and digital literacy training, professional certifications, and workforce development programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Whole-person support: financial coaching, mentorship, wellness resources, and family services</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full min-h-[44px]" data-testid="button-stakeholder-participants-cta" aria-label="Get started as a participant">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* Compliance Badges */}
      <section className="py-8 px-4 sm:px-8 border-t" data-testid="section-compliance">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Badge variant="outline" className="border-primary/30 text-muted-foreground" data-testid="badge-coppa">
              <Shield className="mr-1.5 h-3.5 w-3.5 text-primary" />
              COPPA Compliant
            </Badge>
            <Badge variant="outline" className="border-primary/30 text-muted-foreground" data-testid="badge-ferpa">
              <Shield className="mr-1.5 h-3.5 w-3.5 text-primary" />
              FERPA Ready
            </Badge>
            <Badge variant="outline" className="border-primary/30 text-muted-foreground" data-testid="badge-wcag">
              <Shield className="mr-1.5 h-3.5 w-3.5 text-primary" />
              WCAG 2.1 AA
            </Badge>
          </div>
        </div>
      </section>

      {/* Enterprise Standards */}
      <section className="py-8 px-4 sm:px-8 bg-muted/50" data-testid="section-standards">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-3">Built with enterprise-grade standards</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span data-testid="text-standard-teks">TEKS Aligned</span>
            <span aria-hidden="true">&#183;</span>
            <span data-testid="text-standard-common-core">Common Core Ready</span>
            <span aria-hidden="true">&#183;</span>
            <span data-testid="text-standard-508">Section 508</span>
            <span aria-hidden="true">&#183;</span>
            <span data-testid="text-standard-soc2">SOC 2 Framework</span>
          </div>
        </div>
      </section>

      {/* Featured Career Pathways */}
      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card" data-testid="section-career-pathways">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <Briefcase className="mr-1 h-3 w-3" /> Career Exploration
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-career-pathways-heading">
              Featured Career Pathways
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-2">
              Explore high-demand career fields with structured progression from exploration to placement.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { title: "Technology", icon: Cpu, salary: "$55K - $130K", desc: "Software development, cybersecurity, data science, and IT infrastructure careers with hands-on project experience." },
              { title: "Healthcare", icon: Stethoscope, salary: "$40K - $120K", desc: "Medical assisting, nursing pathways, health informatics, and community health careers serving local populations." },
              { title: "Business & Finance", icon: DollarSign, salary: "$45K - $110K", desc: "Accounting, financial planning, entrepreneurship, and business management with real-world simulations." },
              { title: "Skilled Trades", icon: Hammer, salary: "$35K - $85K", desc: "Electrician, plumbing, HVAC, and construction management pathways with apprenticeship connections." },
              { title: "Engineering", icon: HardHat, salary: "$60K - $140K", desc: "Mechanical, civil, and electrical engineering foundations with CAD training and project-based learning." },
              { title: "Education", icon: GraduationCap, salary: "$38K - $75K", desc: "Teaching, tutoring, curriculum design, and educational technology careers building the next generation." },
            ].map((career) => (
              <Card key={career.title} className="p-5 hover-elevate" data-testid={`card-career-${career.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                    <career.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold" data-testid={`text-career-title-${career.title.toLowerCase().replace(/\s+/g, '-')}`}>{career.title}</h3>
                      <Badge variant="outline" className="text-xs" data-testid={`badge-salary-${career.title.toLowerCase().replace(/\s+/g, '-')}`}>{career.salary}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1" data-testid={`text-career-desc-${career.title.toLowerCase().replace(/\s+/g, '-')}`}>{career.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Program Designer CTA */}
      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-program-designer-cta">
        <div className="mx-auto max-w-5xl">
          <Card className="p-6 sm:p-10 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="rounded-md bg-primary/10 p-4 shrink-0">
                <Lightbulb className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl font-bold mb-2" data-testid="text-designer-cta-heading">
                  Design Your Next Community Program
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                  Use the MAP-GAP Program Designer wizard to identify a problem, analyze community context through the Three Realities, and generate AI-powered intervention designs with grant alignment scoring.
                </p>
              </div>
              <Link href="/program-designer">
                <Button size="lg" className="shrink-0 min-h-[44px]" data-testid="button-launch-program-designer">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  Launch Designer
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-how-it-works">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <Target className="mr-1 h-3 w-3" /> Getting Started
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-how-it-works-heading">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-2">
              Three steps from community insight to measurable impact.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { step: 1, title: "Understand the Community", desc: "Enter any location and see layered data: health, crime, poverty, resources, employment gaps. Know exactly what your community needs.", icon: Search },
              { step: 2, title: "Find Aligned Funding", desc: "The Grant Discovery Engine matches your capabilities to federal, state, and private funding opportunities with AI-powered fit scoring.", icon: Target },
              { step: 3, title: "Deliver & Measure", desc: "Deploy programs through local partners, track service delivery, and generate outcome reports that prove impact to every funder.", icon: Zap },
            ].map((item) => (
              <Card key={item.step} className="p-6 text-center" data-testid={`card-step-${item.step}`}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-primary" data-testid={`text-step-number-${item.step}`}>{item.step}</span>
                </div>
                <item.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2" data-testid={`text-step-title-${item.step}`}>{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-step-desc-${item.step}`}>{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card" data-testid="section-success-stories">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <Award className="mr-1 h-3 w-3" /> Community Impact
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-success-stories-heading">
              Success Stories
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-2">
              Real people, real outcomes — from returning citizens to young professionals to community leaders.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { name: "Marcus Williams", role: "Returning Citizen", pathway: "Skilled Trades", quote: "After 8 years inside, I had no idea where to start. The case manager connected me to a welding program through the platform, and the AI navigator helped me find housing and transportation. Six months later, I am employed full-time with benefits. My kids can see a different future now." },
              { name: "Maria Santos", role: "Career Changer", pathway: "Technology", quote: "I was a single mom working two part-time jobs with no path forward. The workforce assessment showed me I had skills I did not even realize. The AI curriculum taught me to use technology professionally, and the employer partner hired me at a livable wage. Everything changed." },
              { name: "Pastor David Chen", role: "Community Partner", pathway: "Faith-Based Org", quote: "Our church wanted to do more than food drives. This platform gave us the tools to run a real workforce program — tracking who we serve, what services we provide, and showing the results to funders. We went from helping a few families to transforming our neighborhood." },
            ].map((story, idx) => (
              <Card key={idx} className="p-6 flex flex-col" data-testid={`card-testimonial-${idx}`}>
                <Quote className="h-6 w-6 text-primary/30 mb-3 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic" data-testid={`text-testimonial-quote-${idx}`}>
                  "{story.quote}"
                </p>
                <div className="mt-4 pt-4 border-t">
                  <p className="font-semibold text-sm" data-testid={`text-testimonial-name-${idx}`}>{story.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground" data-testid={`text-testimonial-role-${idx}`}>{story.role}</span>
                    <Badge variant="outline" className="text-xs" data-testid={`badge-testimonial-pathway-${idx}`}>{story.pathway}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Grant Alignment */}
      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-grant-alignment">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-4">
              <Shield className="mr-1 h-3 w-3" /> Grant Compliance
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-grant-alignment-heading">
              Grant Alignment
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-2">
              Our platform meets key workforce development grant criteria across all major funding categories.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { label: "Workforce Training", icon: Wrench },
              { label: "Job Placement", icon: Briefcase },
              { label: "Recidivism Reduction", icon: Shield },
              { label: "Career Advancement", icon: TrendingUp },
              { label: "Community Health", icon: Heart },
              { label: "Service Delivery", icon: HandshakeIcon },
            ].map((criterion) => (
              <Card key={criterion.label} className="p-4 text-center" data-testid={`card-grant-${criterion.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  <criterion.icon className="h-4 w-4 text-primary shrink-0" />
                </div>
                <p className="text-xs sm:text-sm font-medium" data-testid={`text-grant-label-${criterion.label.toLowerCase().replace(/\s+/g, '-')}`}>{criterion.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:py-14 sm:px-6 border-t bg-card" data-testid="footer-main">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-semibold" data-testid="text-footer-brand">ThriveUp Academy</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-2" data-testid="text-footer-tagline">
                The tools that do the work — AI-powered workforce development, grant discovery, prevention programming, and community enablement for under-resourced communities.
              </p>
              <p className="text-xs text-muted-foreground/70" data-testid="text-footer-foundation">
                The Collaborative Advocate Foundation 501(c)(3) &middot; VOSB
              </p>
            </div>

            <div data-testid="footer-column-platform">
              <h4 className="font-semibold text-sm mb-3" data-testid="text-footer-platform-heading">Platform</h4>
              <ul className="space-y-2">
                <li><Link href="/grants" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-grants">Grant Discovery</Link></li>
                <li><Link href="/reentry" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-reentry">Case Management</Link></li>
                <li><Link href="/outcomes" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-outcomes">Outcome Reporting</Link></li>
                <li><Link href="/resources" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-resources-link">Resource Finder</Link></li>
              </ul>
            </div>

            <div data-testid="footer-column-partners">
              <h4 className="font-semibold text-sm mb-3" data-testid="text-footer-partners-heading">For Partners</h4>
              <ul className="space-y-2">
                <li><Link href="/partners" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-community-partners">Community Partners</Link></li>
                <li><Link href="/justice-partners" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-justice-partners">Justice Partners</Link></li>
                <li><Link href="/impact" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-impact">Impact Dashboard</Link></li>
                <li><Link href="/api-docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-api-docs">API Documentation</Link></li>
              </ul>
            </div>

            <div data-testid="footer-column-resources">
              <h4 className="font-semibold text-sm mb-3" data-testid="text-footer-resources-heading">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/resources" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-resources">Resource Finder</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-contact">Contact Us</Link></li>
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-privacy">Privacy Policy</Link></li>
                <li>
                  <a href="mailto:sisnett.meredith@gmail.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5" data-testid="link-footer-email-1">
                    <Mail className="h-3.5 w-3.5" /> sisnett.meredith@gmail.com
                  </a>
                </li>
                <li>
                  <a href="mailto:mr.terryflood@gmail.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5" data-testid="link-footer-email-2">
                    <Mail className="h-3.5 w-3.5" /> mr.terryflood@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
}
