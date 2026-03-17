import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import {
  Shield, Heart, BookOpen, MessageSquare, ClipboardCheck,
  CheckCircle, ArrowRight, Sparkles, ChevronDown, ChevronUp,
  ExternalLink, AlertTriangle,
} from "lucide-react";
import type { ParentEducationModule, ParentEducationProgress, FamilyAssessment } from "@shared/schema";

interface DashboardData {
  totalModules: number;
  completedModules: number;
  totalAssessments: number;
}

interface ConversationStarter {
  opener: string;
  explanation: string;
  followUp: string;
}

interface QuestionsData {
  risk: Array<{ id: string; domain: string; text: string; options: string[]; scores: number[] }>;
  protective: Array<{ id: string; domain: string; text: string; options: string[]; scores: number[] }>;
}

function OverviewTab() {
  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/parent-education/dashboard"],
  });
  const { data: progress } = useQuery<ParentEducationProgress[]>({
    queryKey: ["/api/parent-education/progress"],
  });
  const { data: assessments } = useQuery<FamilyAssessment[]>({
    queryKey: ["/api/parent-education/family-assessments"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const completedCount = progress?.filter(p => p.status === "completed").length || 0;
  const totalModules = dashboard?.totalModules || 0;
  const completionPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const latestAssessment = assessments?.[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6" data-testid="card-overview-modules">
          <div className="flex items-start gap-3">
            <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Modules Completed</p>
              <p className="text-2xl font-bold" data-testid="text-completed-count">{completedCount} / {totalModules}</p>
              <Progress value={completionPct} className="mt-2" />
            </div>
          </div>
        </Card>

        <Card className="p-6" data-testid="card-overview-assessments">
          <div className="flex items-start gap-3">
            <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Family Assessments</p>
              <p className="text-2xl font-bold" data-testid="text-assessment-count">{assessments?.length || 0}</p>
              {latestAssessment && (
                <p className="text-xs text-muted-foreground mt-1">
                  Risk: {latestAssessment.riskScore} | Protective: {latestAssessment.protectiveScore}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6" data-testid="card-overview-progress">
          <div className="flex items-start gap-3">
            <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-2xl font-bold" data-testid="text-progress-pct">{completionPct}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {completionPct >= 80 ? "Outstanding engagement!" : completionPct >= 50 ? "Great progress!" : "Keep going!"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {latestAssessment && (
        <Card className="p-6" data-testid="card-latest-assessment">
          <h3 className="font-semibold mb-3">Latest Family Assessment Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
              <div className="flex items-center gap-2">
                <Progress value={(latestAssessment.riskScore / 18) * 100} className="flex-1" />
                <span className="text-sm font-medium">{latestAssessment.riskScore}/18</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Protective Score</p>
              <div className="flex items-center gap-2">
                <Progress value={(latestAssessment.protectiveScore / 18) * 100} className="flex-1" />
                <span className="text-sm font-medium">{latestAssessment.protectiveScore}/18</span>
              </div>
            </div>
          </div>
          {Array.isArray(latestAssessment.recommendations) && latestAssessment.recommendations.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Recommendations</p>
              <ul className="space-y-1">
                {(latestAssessment.recommendations as string[]).map((rec, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function ModulesTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: modules, isLoading } = useQuery<ParentEducationModule[]>({
    queryKey: ["/api/parent-education/modules"],
  });
  const { data: progress } = useQuery<ParentEducationProgress[]>({
    queryKey: ["/api/parent-education/progress"],
  });

  const completeMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      return apiRequest("POST", "/api/parent-education/progress", { moduleId, status: "completed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-education/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-education/dashboard"] });
      toast({ title: "Module completed!", description: "Great job! Your progress has been saved." });
    },
  });

  const filteredModules = modules?.filter(m =>
    selectedCategory === "all" || m.category === selectedCategory
  ) || [];

  const getModuleStatus = (moduleId: string) => {
    return progress?.find(p => p.moduleId === moduleId)?.status || "not_started";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            data-testid={`button-filter-${cat.value}`}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredModules.map(mod => {
          const status = getModuleStatus(mod.id);
          const isExpanded = expandedModule === mod.id;
          const sections = Array.isArray(mod.contentSections) ? mod.contentSections as Array<{ title: string; content: string }> : [];

          return (
            <Card key={mod.id} className="p-6" data-testid={`card-module-${mod.id}`}>
              <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
                <Badge variant={mod.category === "substance_prevention" ? "default" : "secondary"} data-testid={`badge-category-${mod.id}`}>
                  {mod.category === "substance_prevention" ? (
                    <><Shield className="h-3 w-3 mr-1" />Prevention</>
                  ) : (
                    <><Heart className="h-3 w-3 mr-1" />Family Strengthening</>
                  )}
                </Badge>
                {status === "completed" && (
                  <Badge variant="outline" className="text-green-600 border-green-600" data-testid={`badge-completed-${mod.id}`}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Completed
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold mb-1" data-testid={`text-module-title-${mod.id}`}>{mod.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{mod.description}</p>

              {mod.targetAudience && (
                <p className="text-xs text-muted-foreground mb-3">Target: {mod.targetAudience}</p>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                data-testid={`button-expand-${mod.id}`}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                {isExpanded ? "Hide Content" : "View Content"}
              </Button>

              {isExpanded && sections.length > 0 && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {sections.map((section, i) => (
                    <div key={i}>
                      <h4 className="text-sm font-medium mb-1">{section.title}</h4>
                      <p className="text-sm text-muted-foreground">{section.content}</p>
                    </div>
                  ))}
                  {status !== "completed" && (
                    <Button
                      onClick={() => completeMutation.mutate(mod.id)}
                      disabled={completeMutation.isPending}
                      data-testid={`button-complete-${mod.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {completeMutation.isPending ? "Saving..." : "Mark as Completed"}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No modules found for this category.</p>
        </Card>
      )}
    </div>
  );
}

function FamilyAssessmentTab() {
  const [riskResponses, setRiskResponses] = useState<Record<string, number>>({});
  const [protectiveResponses, setProtectiveResponses] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const { data: questions, isLoading: questionsLoading } = useQuery<QuestionsData>({
    queryKey: ["/api/parent-education/family-questions"],
  });

  const { data: assessments } = useQuery<FamilyAssessment[]>({
    queryKey: ["/api/parent-education/family-assessments"],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/parent-education/family-assessments", { riskResponses, protectiveResponses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-education/family-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-education/dashboard"] });
      setShowResults(true);
      toast({ title: "Assessment submitted!", description: "Your family assessment has been saved." });
    },
  });

  const riskQuestions = questions?.risk || [];
  const protectiveQuestions = questions?.protective || [];
  const allRiskAnswered = riskQuestions.every(q => riskResponses[q.id] !== undefined);
  const allProtectiveAnswered = protectiveQuestions.every(q => protectiveResponses[q.id] !== undefined);
  const canSubmit = allRiskAnswered && allProtectiveAnswered;

  if (questionsLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>;
  }

  const latestAssessment = assessments?.[0];

  if (showResults && latestAssessment) {
    return (
      <div className="space-y-6">
        <Card className="p-6" data-testid="card-assessment-results">
          <h3 className="text-lg font-semibold mb-4">Your Family Assessment Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Risk Factors Score</p>
              <div className="flex items-center gap-3 mb-2">
                <Progress value={(latestAssessment.riskScore / 18) * 100} className="flex-1" />
                <span className="text-lg font-bold">{latestAssessment.riskScore}/18</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {latestAssessment.riskScore <= 6 ? "Low risk - great foundation!" : latestAssessment.riskScore <= 12 ? "Moderate risk - some areas to address" : "Higher risk - focus on protective strategies"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Protective Factors Score</p>
              <div className="flex items-center gap-3 mb-2">
                <Progress value={(latestAssessment.protectiveScore / 18) * 100} className="flex-1" />
                <span className="text-lg font-bold">{latestAssessment.protectiveScore}/18</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {latestAssessment.protectiveScore >= 14 ? "Strong protective factors!" : latestAssessment.protectiveScore >= 9 ? "Good - keep building these strengths" : "Focus on strengthening these areas"}
              </p>
            </div>
          </div>
        </Card>

        {Array.isArray(latestAssessment.recommendations) && (latestAssessment.recommendations as string[]).length > 0 && (
          <Card className="p-6" data-testid="card-assessment-recommendations">
            <h3 className="font-semibold mb-3">Personalized Recommendations</h3>
            <div className="space-y-2">
              {(latestAssessment.recommendations as string[]).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Button onClick={() => { setShowResults(false); setRiskResponses({}); setProtectiveResponses({}); }} data-testid="button-retake-assessment">
          Take Assessment Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-primary/5 border-primary/20" data-testid="card-assessment-intro">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">This assessment is confidential</p>
            <p className="text-xs text-muted-foreground">Your answers help identify family strengths and areas for growth. Results are private and used to provide personalized recommendations.</p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="font-semibold mb-4">Part 1: Family Risk Factors</h3>
        <div className="space-y-4">
          {riskQuestions.map(q => (
            <Card key={q.id} className="p-4" data-testid={`card-risk-question-${q.id}`}>
              <p className="text-sm font-medium mb-3">{q.text}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, i) => (
                  <Button
                    key={i}
                    variant={riskResponses[q.id] === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRiskResponses(prev => ({ ...prev, [q.id]: i }))}
                    data-testid={`button-risk-${q.id}-${i}`}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Part 2: Family Protective Factors</h3>
        <div className="space-y-4">
          {protectiveQuestions.map(q => (
            <Card key={q.id} className="p-4" data-testid={`card-protective-question-${q.id}`}>
              <p className="text-sm font-medium mb-3">{q.text}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, i) => (
                  <Button
                    key={i}
                    variant={protectiveResponses[q.id] === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProtectiveResponses(prev => ({ ...prev, [q.id]: i }))}
                    data-testid={`button-protective-${q.id}-${i}`}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Button
        onClick={() => submitMutation.mutate()}
        disabled={!canSubmit || submitMutation.isPending}
        data-testid="button-submit-assessment"
      >
        <ClipboardCheck className="h-4 w-4 mr-2" />
        {submitMutation.isPending ? "Submitting..." : "Submit Assessment"}
      </Button>
    </div>
  );
}

function ConversationStartersTab() {
  const [topic, setTopic] = useState("");
  const [childAge, setChildAge] = useState("");
  const [starters, setStarters] = useState<ConversationStarter[]>([]);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/parent-education/conversation-starters", { topic, childAge });
      return res.json();
    },
    onSuccess: (data: { starters: ConversationStarter[] }) => {
      setStarters(data.starters || []);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate conversation starters. Please try again.", variant: "destructive" });
    },
  });

  const topicSuggestions = [
    "alcohol and underage drinking",
    "vaping and e-cigarettes",
    "marijuana and cannabis",
    "peer pressure",
    "online safety",
    "stress and mental health",
    "prescription drug safety",
    "making healthy choices",
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6" data-testid="card-conversation-form">
        <h3 className="font-semibold mb-2">AI Conversation Starter Generator</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get personalized conversation starters to help you talk to your child about important topics.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">What topic do you want to discuss?</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {topicSuggestions.map(t => (
                <Button
                  key={t}
                  variant={topic === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTopic(t)}
                  data-testid={`button-topic-${t.replace(/\s/g, '-')}`}
                >
                  {t}
                </Button>
              ))}
            </div>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Or type your own topic..."
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              data-testid="input-topic"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Child's age (optional)</label>
            <input
              type="text"
              value={childAge}
              onChange={e => setChildAge(e.target.value)}
              placeholder="e.g., 12, 15, 10-14"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm max-w-[200px]"
              data-testid="input-child-age"
            />
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!topic || generateMutation.isPending}
            data-testid="button-generate-starters"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generateMutation.isPending ? "Generating..." : "Generate Conversation Starters"}
          </Button>
        </div>
      </Card>

      {starters.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Conversation Starters</h3>
          {starters.map((starter, i) => (
            <Card key={i} className="p-6" data-testid={`card-starter-${i}`}>
              <div className="space-y-3">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    <MessageSquare className="h-3 w-3 mr-1" /> Opener
                  </Badge>
                  <p className="text-sm font-medium italic" data-testid={`text-opener-${i}`}>"{starter.opener}"</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Why this works:</p>
                  <p className="text-sm text-muted-foreground">{starter.explanation}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Follow-up question:</p>
                  <p className="text-sm italic" data-testid={`text-followup-${i}`}>"{starter.followUp}"</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourcesTab() {
  const resources = [
    {
      title: "SAMHSA - Talk. They Hear You.",
      url: "https://www.samhsa.gov/talk-they-hear-you",
      description: "Free resources for parents to prevent underage alcohol and drug use.",
      icon: Shield,
    },
    {
      title: "NIDA for Teens",
      url: "https://nida.nih.gov/research-topics/parents-educators",
      description: "National Institute on Drug Abuse resources for parents and educators.",
      icon: BookOpen,
    },
    {
      title: "CDC - Parenting Information",
      url: "https://www.cdc.gov/parents/",
      description: "Evidence-based parenting tips and child development resources.",
      icon: Heart,
    },
    {
      title: "Strengthening Families Program",
      url: "https://strengtheningfamiliesprogram.org/",
      description: "Evidence-based family skills training program for high-risk families.",
      icon: Heart,
    },
    {
      title: "Partnership to End Addiction",
      url: "https://drugfree.org/",
      description: "Support and resources for families dealing with substance use.",
      icon: Shield,
    },
    {
      title: "988 Suicide & Crisis Lifeline",
      url: "https://988lifeline.org/",
      description: "24/7 crisis support. Call or text 988 for immediate help.",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These evidence-based resources provide additional support for families focused on prevention and strengthening.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((resource, i) => (
          <Card key={i} className="p-6 hover-elevate" data-testid={`card-resource-${i}`}>
            <div className="flex items-start gap-3">
              <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
                <resource.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">{resource.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{resource.description}</p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary"
                  data-testid={`link-resource-${i}`}
                >
                  Visit Resource <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ParentEducationPage() {
  useEffect(() => {
    document.title = "Parent Education & Family Strengthening | ThriveUp Academy";
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Parent Education & Family Strengthening"
        description="Substance prevention education and family strengthening resources for parents and guardians"
        breadcrumbs={[{ label: "Prevention", href: "/prevention" }, { label: "Parent Education" }]}
      />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex flex-wrap gap-1" data-testid="tabs-parent-education">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="modules" data-testid="tab-modules">Modules</TabsTrigger>
          <TabsTrigger value="assessment" data-testid="tab-assessment">Family Assessment</TabsTrigger>
          <TabsTrigger value="conversation" data-testid="tab-conversation">Conversation Starters</TabsTrigger>
          <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="modules" className="mt-4">
          <ModulesTab />
        </TabsContent>

        <TabsContent value="assessment" className="mt-4">
          <FamilyAssessmentTab />
        </TabsContent>

        <TabsContent value="conversation" className="mt-4">
          <ConversationStartersTab />
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <ResourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
