import { useState, useEffect } from "react";
import { useJourneyContext, journeyLane } from "@/lib/journey-context";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import {
  Users, BookOpen, Shield, Brain, Heart,
  MonitorSmartphone, MessageSquare, BarChart3,
  Video, FileText, Phone, MessagesSquare,
  Calendar, MapPin, Clock, ArrowRight, Sparkles, Mail,
  Briefcase, GraduationCap, Target, CheckCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";
import type { ParentEducationModule, ParentEducationProgress } from "@shared/schema";

const whyItMatters = [
  {
    icon: Users,
    title: "Learn Together",
    desc: "Parents and children build AI and digital skills side by side, preparing the whole family for the future workforce.",
  },
  {
    icon: BookOpen,
    title: "Stay Informed",
    desc: "Understand what your child is learning, how AI tools work, and how these skills connect to career readiness.",
  },
  {
    icon: Briefcase,
    title: "Career-Ready Families",
    desc: "Support your child's school-to-career journey with workforce development resources and career pathway guidance.",
  },
];

const trainingModules = [
  {
    icon: MonitorSmartphone,
    title: "Getting Started with ThriveUp Academy",
    difficulty: "Beginner",
    desc: "Navigating the platform, setting up profiles, understanding progress tracking and career pathway tools.",
  },
  {
    icon: Brain,
    title: "Understanding AI in Education & Careers",
    difficulty: "Beginner",
    desc: "What AI is, how Spark works, and how AI mastery prepares youth for workforce success.",
  },
  {
    icon: Shield,
    title: "Internet Safety for Families",
    difficulty: "Beginner",
    desc: "Online safety basics, privacy, screen time management, and digital citizenship.",
  },
  {
    icon: BarChart3,
    title: "Supporting Your Child's Career Pathway",
    difficulty: "Intermediate",
    desc: "Using progress reports, tracking workforce readiness milestones, and encouraging growth mindset.",
  },
  {
    icon: MessageSquare,
    title: "Digital Communication & Job Readiness",
    difficulty: "Intermediate",
    desc: "Professional communication, digital etiquette, and workplace-ready skills for families.",
  },
  {
    icon: Target,
    title: "Workforce Development Tools",
    difficulty: "Intermediate",
    desc: "Understanding career pipelines, skill training resources, mentorship connections, and industry pathways.",
  },
];

const workshopSchedule = [
  {
    icon: Calendar,
    text: "Every Saturday, 10am-12pm at Austin Central Library",
  },
  {
    icon: MapPin,
    text: "Tuesday evenings, 6pm-8pm at various Austin Community Centers",
  },
  {
    icon: Clock,
    text: "One-on-one career pathway support and tech help available by appointment",
  },
];

const resources = [
  {
    icon: Video,
    title: "Video Tutorials",
    desc: "Step-by-step guides for platform navigation and career tools, available in English and Spanish.",
  },
  {
    icon: GraduationCap,
    title: "Career Pathway Guides",
    desc: "Downloadable guides to school-to-career pipelines and workforce readiness milestones.",
  },
  {
    icon: Phone,
    title: "Help Line",
    desc: "Phone and chat support available in English and Spanish for families and guardians.",
  },
  {
    icon: MessagesSquare,
    title: "Community Forum",
    desc: "Connect with other families navigating workforce development and AI education.",
  },
];

interface ContentSectionShape {
  _meta?: boolean;
  title: string;
  titleEs?: string;
  content: string;
  contentEs?: string;
  descriptionEs?: string;
}

function PreventionFamilyTab() {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: rawModules, isLoading } = useQuery<ParentEducationModule[]>({
    queryKey: ["/api/parent-education/modules"],
  });
  const modules = rawModules ?? [];

  const { data: rawProgress } = useQuery<ParentEducationProgress[]>({
    queryKey: ["/api/parent-education/progress"],
  });
  const progress = rawProgress ?? [];

  const completedCount = progress.filter(p => p.status === "completed").length;
  const totalModules = modules.length;
  const completionPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const filteredModules = modules.filter(m =>
    selectedCategory === "all" || m.category === selectedCategory
  );

  const getModuleStatus = (moduleId: string) => {
    return progress.find(p => p.moduleId === moduleId)?.status || "not_started";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6" data-testid="card-prev-progress">
          <div className="flex items-start gap-3">
            <div className="rounded-md p-2.5 bg-orange-500/10 shrink-0">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Prevention Modules</p>
              <p className="text-2xl font-bold" data-testid="text-prev-module-count">{completedCount} / {totalModules}</p>
              <Progress value={completionPct} className="mt-2" />
            </div>
          </div>
        </Card>

        <Link href="/parent-education" className="block">
          <Card className="p-6 hover-elevate cursor-pointer h-full" data-testid="card-goto-full-hub">
            <div className="flex items-start gap-3">
              <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Full Prevention Hub</p>
                <p className="text-xs text-muted-foreground mt-1">Family assessments, AI conversation starters, and bilingual resources</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
            </div>
          </Card>
        </Link>

        <Link href="/parent-education?tab=conversation" className="block">
          <Card className="p-6 hover-elevate cursor-pointer h-full" data-testid="card-goto-conversations">
            <div className="flex items-start gap-3">
              <div className="rounded-md p-2.5 bg-green-500/10 shrink-0">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Conversation Toolkit</p>
                <p className="text-xs text-muted-foreground mt-1">Age-banded talking points (10-14 & 15-18) for difficult topics</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
            </div>
          </Card>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All Modules" },
          { value: "substance_prevention", label: "Substance Prevention" },
          { value: "family_strengthening", label: "Family Strengthening" },
        ].map(cat => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.value)}
            data-testid={`button-prev-filter-${cat.value}`}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModules.map(mod => {
            const status = getModuleStatus(mod.id);
            const isExpanded = expandedModule === mod.id;
            const rawSections = Array.isArray(mod.contentSections) ? mod.contentSections as ContentSectionShape[] : [];
            const sections = rawSections.filter(s => !s._meta);

            return (
              <Card key={mod.id} className="p-5" data-testid={`card-prev-module-${mod.id}`}>
                <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                  <Badge variant={mod.category === "substance_prevention" ? "default" : "secondary"}>
                    {mod.category === "substance_prevention" ? (
                      <><Shield className="h-3 w-3 mr-1" />Prevention</>
                    ) : (
                      <><Heart className="h-3 w-3 mr-1" />Family</>
                    )}
                  </Badge>
                  {status === "completed" && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" /> Done
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-sm mb-1">{mod.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{mod.description}</p>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                  data-testid={`button-prev-expand-${mod.id}`}
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  {isExpanded ? "Hide" : "Preview"}
                </Button>

                {isExpanded && sections.length > 0 && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {sections.map((section, i) => (
                      <div key={i}>
                        <p className="text-xs font-medium">{section.title}</p>
                        <p className="text-xs text-muted-foreground">{section.content}</p>
                      </div>
                    ))}
                    <Link href="/parent-education">
                      <Button size="sm" variant="outline" data-testid={`button-prev-full-module-${mod.id}`}>
                        Open in Full Hub <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {filteredModules.length === 0 && !isLoading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No modules found for this category.</p>
        </Card>
      )}
    </div>
  );
}

function TrainingTab() {
  return (
    <div className="space-y-10">
      <div>
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            <Brain className="mr-1 h-3 w-3" /> Digital & Workforce Literacy
          </Badge>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-modules-heading">
            Training Modules
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Self-paced courses designed for parents and guardians covering digital skills and career readiness.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainingModules.map((mod) => (
            <Card key={mod.title} className="p-6 hover-elevate" data-testid={`card-module-${mod.title.toLowerCase().replace(/\s/g, '-')}`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                    <mod.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge
                    variant={mod.difficulty === "Beginner" ? "secondary" : "outline"}
                    data-testid={`badge-difficulty-${mod.title.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {mod.difficulty}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-1" data-testid={`text-module-${mod.title.toLowerCase().replace(/\s/g, '-')}`}>
                    {mod.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            <Calendar className="mr-1 h-3 w-3" /> In-Person Workshops
          </Badge>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-workshops-heading">
            Workshop Schedule
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Free in-person workshops at community centers. Build workforce-ready skills alongside your family.
          </p>
        </div>
        <Card className="p-8 md:p-10 max-w-2xl mx-auto" data-testid="card-workshop-schedule">
          <div className="space-y-5 mb-8">
            {workshopSchedule.map((item, i) => (
              <div key={i} className="flex items-start gap-4" data-testid={`text-workshop-${i}`}>
                <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm leading-relaxed pt-1.5">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/community">
              <Button data-testid="button-view-full-schedule">
                View Full Schedule
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ResourcesTab() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" data-testid="text-resources-heading">
          Resources
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Support for families navigating digital literacy, career pathways, and workforce development.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.map((resource) => (
          <Card key={resource.title} className="p-6 hover-elevate" data-testid={`card-resource-${resource.title.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="rounded-md bg-primary/10 p-2.5">
                <resource.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold" data-testid={`text-resource-${resource.title.toLowerCase().replace(/\s/g, '-')}`}>
                {resource.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{resource.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ParentResourcesPage() {
  useEffect(() => {
    document.title = "Family Resources & Workforce Readiness | ThriveUp Academy";
  }, []);
  // R1 Phase B: helpers (CHWs, nonprofits, agencies) arrive on the workshops tab; families keep Prevention & Family.
  const arrivalTab = journeyLane(useJourneyContext().audience) === "navigator" ? "training" : "prevention";

  return (
    <div className="min-h-screen">
      <div className="px-6 pt-6">
        <div className="mx-auto max-w-5xl">
          <PageHeader
            title="Parent Resources"
            description="Empowering families to support their children's workforce readiness journey"
            breadcrumbs={[{label:"Parent Resources"}]}
          />
        </div>
      </div>

      <section className="px-6 pt-2 pb-4">
        <div className="mx-auto max-w-5xl space-y-3">
          <Link href="/parents/dashboard" aria-label="View your child's progress dashboard">
            <Card className="p-6 hover-elevate cursor-pointer border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5" data-testid="card-view-progress-dashboard">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h2 className="text-lg font-bold mb-0.5">View Your Child's Progress</h2>
                  <p className="text-sm text-muted-foreground">Track scores, career pathway milestones, workforce readiness, and personalized recommendations</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </Card>
          </Link>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 px-6 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-6 bg-white/15 text-white border-white/20" data-testid="badge-for-parents">
            Family & Community Resource Hub
          </Badge>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-tight" data-testid="text-hero-title">
            Family Resources &<br />Workforce Readiness
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-3">
            Empowering families to support their children's school-to-career journey through AI mastery and workforce development
          </p>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            Build digital and workforce-ready skills as a family. Free training, career pathway workshops, and resources for under-resourced communities.
          </p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="text-why-matters-heading">
              Why Family Engagement Matters
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              When families engage in workforce readiness together, youth build stronger school-to-career pipelines.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {whyItMatters.map((item) => (
              <Card key={item.title} className="p-6 hover-elevate" data-testid={`card-why-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid={`text-why-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <Tabs key={arrivalTab} defaultValue={arrivalTab} className="w-full">
            <TabsList className="flex flex-wrap gap-1 mb-6" data-testid="tabs-parents">
              <TabsTrigger value="prevention" data-testid="tab-prevention-family">Prevention & Family</TabsTrigger>
              <TabsTrigger value="training" data-testid="tab-training">Training & Workshops</TabsTrigger>
              <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="prevention" className="mt-4">
              <PreventionFamilyTab />
            </TabsContent>

            <TabsContent value="training" className="mt-4">
              <TrainingTab />
            </TabsContent>

            <TabsContent value="resources" className="mt-4">
              <ResourcesTab />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <footer className="py-10 px-6 border-t">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold">ThriveUp Academy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Empowering families and communities for workforce readiness together.
          </p>
          <div className="flex flex-col items-end gap-1">
            <a href="mailto:programs@thecollaborativeadvocate.org" className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="link-support-email" aria-label="Email programs at the Collaborative Advocate">
              <Mail className="h-3.5 w-3.5" /> programs@thecollaborativeadvocate.org
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
