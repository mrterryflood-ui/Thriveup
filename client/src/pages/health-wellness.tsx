import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import {
  Heart, Brain, Shield, Users, Baby, Globe, Activity,
  ClipboardCheck, BookOpen, ChevronRight, CheckCircle2,
  AlertTriangle, MapPin, Sparkles, ArrowLeft, LogIn,
} from "lucide-react";

interface HealthAssessment {
  id: string;
  title: string;
  description: string;
  assessmentType: string;
  productLine: string;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    scores: number[];
  }>;
  scoringRubric: {
    maxScore: number;
    thresholds: Record<string, number>;
  };
}

interface ScreeningResult {
  id: string;
  userId: string;
  assessmentId: string;
  assessmentType: string;
  totalScore: number;
  maxScore: number;
  riskLevel: string;
  recommendations: string[];
  completedAt: string;
}

interface WellnessResource {
  id: string;
  title: string;
  description: string;
  content: string;
  productLine: string;
  category: string;
  resourceType: string;
  tags: string[];
  iconName: string;
}

interface ProductLine {
  id: string;
  name: string;
  description: string;
  color: string;
}

const PRODUCT_LINE_ICONS: Record<string, typeof Heart> = {
  "mental-wellness": Brain,
  "herhealth": Heart,
  "healthy-black-men": Shield,
  "birthright": Baby,
  "mce": Globe,
};

function getRiskColor(level: string) {
  switch (level) {
    case "low": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "moderate": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "elevated": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "high": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    default: return "bg-muted text-muted-foreground";
  }
}

function getRiskLabel(level: string) {
  switch (level) {
    case "low": return "Low Risk - Thriving";
    case "moderate": return "Moderate - Some Attention Needed";
    case "elevated": return "Elevated - Support Recommended";
    case "high": return "High - Immediate Support Encouraged";
    default: return level;
  }
}

function AssessmentCard({ assessment, onStart, lastResult }: {
  assessment: HealthAssessment;
  onStart: (id: string) => void;
  lastResult?: ScreeningResult;
}) {
  const Icon = PRODUCT_LINE_ICONS[assessment.productLine] || Heart;
  return (
    <Card className="p-5" data-testid={`card-assessment-${assessment.id}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-md p-2 bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
          <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm" data-testid={`text-assessment-title-${assessment.id}`}>
            {assessment.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{assessment.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {assessment.questions.length} questions
          </Badge>
          {lastResult && (
            <Badge variant="secondary" className={getRiskColor(lastResult.riskLevel)} data-testid={`badge-risk-${assessment.id}`}>
              {lastResult.riskLevel}
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={() => onStart(assessment.id)} data-testid={`button-start-${assessment.id}`}>
          {lastResult ? "Retake" : "Start"} <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function AssessmentTaker({ assessment, onComplete, onCancel }: {
  assessment: HealthAssessment;
  onComplete: (responses: Record<string, number>, totalScore: number) => void;
  onCancel: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const questions = assessment.questions;
  const q = questions[currentQ];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(responses).length;

  const handleAnswer = (optionIndex: number) => {
    const newResponses = { ...responses, [q.id]: optionIndex };
    setResponses(newResponses);

    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      onComplete(newResponses, 0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="section-assessment-taker">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-assessment">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="font-semibold text-lg">{assessment.title}</h2>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Question {currentQ + 1} of {totalQuestions}</span>
          <span>{Math.round(((currentQ + 1) / totalQuestions) * 100)}%</span>
        </div>
        <Progress value={((currentQ + 1) / totalQuestions) * 100} className="h-2" data-testid="progress-assessment" />
      </div>

      <Card className="p-6" data-testid="card-current-question">
        <p className="text-base font-medium mb-6" data-testid="text-question">{q.text}</p>
        <div className="space-y-3">
          {q.options.map((option, i) => (
            <Button
              key={i}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4"
              onClick={() => handleAnswer(i)}
              data-testid={`button-option-${i}`}
            >
              {option}
            </Button>
          ))}
        </div>
      </Card>

      {currentQ > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => setCurrentQ(currentQ - 1)}
          data-testid="button-prev-question"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Previous Question
        </Button>
      )}
    </div>
  );
}

function ScreeningResultView({ result, onDismiss }: { result: ScreeningResult; onDismiss: () => void }) {
  const scorePct = Math.round((result.totalScore / result.maxScore) * 100);

  return (
    <div className="max-w-2xl mx-auto" data-testid="section-screening-result">
      <Button variant="ghost" size="sm" onClick={onDismiss} className="mb-4" data-testid="button-back-to-hub">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Health Hub
      </Button>

      <Card className="p-6" data-testid="card-result-summary">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
            <CheckCircle2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold mb-2" data-testid="text-result-title">Assessment Complete</h2>
          <Badge className={`text-sm py-1 px-3 ${getRiskColor(result.riskLevel)}`} data-testid="badge-result-risk">
            {getRiskLabel(result.riskLevel)}
          </Badge>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Wellness Score</span>
            <span className="font-semibold">{result.totalScore} / {result.maxScore}</span>
          </div>
          <Progress value={scorePct} className="h-3" data-testid="progress-result-score" />
        </div>

        {result.recommendations && result.recommendations.length > 0 && (
          <div data-testid="section-recommendations">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Recommendations
            </h3>
            <ul className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-recommendation-${i}`}>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-6 border-t pt-4" data-testid="text-disclaimer">
          This screening is for informational purposes only and is not a clinical diagnosis. If you are in crisis, please contact the 988 Suicide & Crisis Lifeline by calling or texting 988.
        </p>
      </Card>
    </div>
  );
}

function ResourceCard({ resource }: { resource: WellnessResource }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = PRODUCT_LINE_ICONS[resource.productLine] || Heart;

  return (
    <Card className="p-4" data-testid={`card-resource-${resource.id}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-md p-2 bg-violet-100 dark:bg-violet-900/30 shrink-0">
          <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm" data-testid={`text-resource-title-${resource.id}`}>{resource.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">{resource.category}</Badge>
            <Badge variant="outline" className="text-[10px]">{resource.resourceType}</Badge>
          </div>
          {expanded && (
            <div className="mt-3 p-3 rounded-md bg-muted/50 text-sm leading-relaxed" data-testid={`text-resource-content-${resource.id}`}>
              {resource.content}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-toggle-resource-${resource.id}`}
          >
            {expanded ? "Show Less" : "Read More"} <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface HealthRecommendation {
  id: string;
  name: string;
  category: string;
  address: string | null;
  contactInfo: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
}

function HealthResourcesMap() {
  const { isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const queryParams = userLocation
    ? `?lat=${userLocation.lat}&lng=${userLocation.lng}`
    : "";

  const { data: recommendations, isLoading } = useQuery<HealthRecommendation[]>({
    queryKey: ["/api/health/recommendations", userLocation?.lat, userLocation?.lng],
    queryFn: () => fetch(`/api/health/recommendations${queryParams}`, { credentials: "include" }).then(r => r.json()),
    enabled: isAuthenticated,
  });

  return (
    <Card className="p-5" data-testid="card-health-map">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-rose-500" /> Nearby Behavioral Health Providers
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Find behavioral health providers, counseling services, and wellness centers in your community using our GIS community intelligence system.
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted/30 rounded-md animate-pulse" />
          ))}
        </div>
      ) : recommendations && recommendations.length > 0 ? (
        <div className="space-y-2 mb-4" data-testid="section-health-recommendations">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="p-3" data-testid={`card-recommendation-${rec.id}`}>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{rec.name}</p>
                  <p className="text-[11px] text-muted-foreground">{rec.category}</p>
                  {rec.address && (
                    <p className="text-[11px] text-muted-foreground truncate">{rec.address}</p>
                  )}
                  {rec.contactInfo && (
                    <p className="text-[11px] text-muted-foreground">{rec.contactInfo}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-muted/30 p-6 text-center mb-4" data-testid="section-no-recommendations">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            No health resources found yet. Use the Resource Finder to explore community resources.
          </p>
        </div>
      )}

      <div className="text-center">
        <a href="/resources">
          <Button variant="outline" size="sm" data-testid="button-open-resource-finder">
            <MapPin className="h-4 w-4 mr-1" /> Open Resource Finder
          </Button>
        </a>
      </div>
    </Card>
  );
}

function PastResultsSection({ results }: { results: ScreeningResult[] }) {
  if (results.length === 0) return null;

  return (
    <div data-testid="section-past-results">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" /> Recent Screenings
      </h3>
      <div className="space-y-2">
        {results.slice(0, 5).map((result) => (
          <Card key={result.id} className="p-3 flex items-center justify-between gap-2" data-testid={`card-past-result-${result.id}`}>
            <div className="flex items-center gap-2 min-w-0">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">{result.assessmentType.replace(/-/g, " ")}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className={`text-[10px] ${getRiskColor(result.riskLevel)}`}>
                {result.riskLevel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(result.completedAt).toLocaleDateString()}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function HealthWellnessPage() {
  useEffect(() => { document.title = "Health & Wellness | ThriveUp"; }, []);

  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<ScreeningResult | null>(null);
  const [selectedProductLine, setSelectedProductLine] = useState<string | null>(null);

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<HealthAssessment[]>({
    queryKey: ["/api/health/assessments"],
  });

  const { data: screeningResults, isLoading: resultsLoading } = useQuery<ScreeningResult[]>({
    queryKey: ["/api/health/screenings"],
    enabled: isAuthenticated,
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery<WellnessResource[]>({
    queryKey: ["/api/health/resources"],
  });

  const { data: productLines } = useQuery<ProductLine[]>({
    queryKey: ["/api/health/product-lines"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { assessmentId: string; responses: Record<string, number> }) => {
      const res = await apiRequest("POST", "/api/health/screenings", data);
      return res.json();
    },
    onSuccess: (result: ScreeningResult) => {
      setLatestResult(result);
      setActiveAssessmentId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/health/screenings"] });
      toast({ title: "Assessment Complete", description: "Your screening results have been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const activeAssessment = assessments?.find(a => a.id === activeAssessmentId);

  const handleStartAssessment = (id: string) => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to take a health assessment.", variant: "destructive" });
      return;
    }
    setActiveAssessmentId(id);
    setLatestResult(null);
    setActiveTab("assessments");
  };

  const handleCompleteAssessment = (responses: Record<string, number>, totalScore: number) => {
    if (!activeAssessment) return;
    submitMutation.mutate({
      assessmentId: activeAssessment.id,
      responses,
    });
  };

  const filteredResources = selectedProductLine
    ? resources?.filter(r => r.productLine === selectedProductLine)
    : resources;

  if (authLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-36 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (latestResult) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="health-wellness-page">
        <PageHeader
          title="Health & Wellness"
          breadcrumbs={[{ label: "Health & Wellness", href: "/health-wellness" }, { label: "Results" }]}
        />
        <ScreeningResultView result={latestResult} onDismiss={() => setLatestResult(null)} />
      </div>
    );
  }

  if (activeAssessment) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="health-wellness-page">
        <PageHeader
          title="Health & Wellness"
          breadcrumbs={[{ label: "Health & Wellness", href: "/health-wellness" }, { label: activeAssessment.title }]}
        />
        <AssessmentTaker
          assessment={activeAssessment}
          onComplete={handleCompleteAssessment}
          onCancel={() => setActiveAssessmentId(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="health-wellness-page">
      <PageHeader
        title="Health & Wellness"
        breadcrumbs={[{ label: "Health & Wellness" }]}
      />

      <div
        className="rounded-md bg-gradient-to-r from-indigo-900 to-violet-700 p-4 sm:p-6 lg:p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="rounded-md p-2.5 bg-white/10">
            <Heart className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-page-title">
            Sankofa Health Network
          </h1>
        </div>
        <p className="text-indigo-100 text-base sm:text-lg" data-testid="text-page-subtitle">
          Integrated behavioral health and wellness resources — culturally responsive care for your whole self
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6" data-testid="tabs-health">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments" data-testid="tab-assessments">Self-Assessments</TabsTrigger>
          <TabsTrigger value="library" data-testid="tab-library">Wellness Library</TabsTrigger>
          <TabsTrigger value="resources" data-testid="tab-resources">Health Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="section-product-lines">
              {(productLines || []).map((pl) => {
                const Icon = PRODUCT_LINE_ICONS[pl.id] || Heart;
                return (
                  <Card
                    key={pl.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => { setSelectedProductLine(pl.id); setActiveTab("library"); }}
                    data-testid={`card-product-line-${pl.id}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="rounded-md p-2" style={{ backgroundColor: `${pl.color}20` }}>
                        <Icon className="h-5 w-5" style={{ color: pl.color }} />
                      </div>
                      <h3 className="font-semibold text-sm">{pl.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{pl.description}</p>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-indigo-500" /> Quick Assessments
                </h3>
                {assessmentsLoading ? (
                  <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {(assessments || []).map((a) => (
                      <AssessmentCard
                        key={a.id}
                        assessment={a}
                        onStart={handleStartAssessment}
                        lastResult={screeningResults?.find(r => r.assessmentId === a.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {isAuthenticated && !resultsLoading && screeningResults && (
                  <PastResultsSection results={screeningResults} />
                )}
                {!isAuthenticated && (
                  <Card className="p-6 text-center" data-testid="card-sign-in-prompt">
                    <LogIn className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">Sign in to save your screening results and track wellness over time</p>
                    <a href="/api/login">
                      <Button size="sm" data-testid="button-sign-in">
                        <LogIn className="h-4 w-4 mr-1" /> Sign In
                      </Button>
                    </a>
                  </Card>
                )}
                <HealthResourcesMap />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assessments">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Complete these self-assessments to understand your current wellness. Results contribute to your Thrive Wellbeing domain score.
            </p>
            {assessmentsLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(assessments || []).map((a) => (
                  <AssessmentCard
                    key={a.id}
                    assessment={a}
                    onStart={handleStartAssessment}
                    lastResult={screeningResults?.find(r => r.assessmentId === a.id)}
                  />
                ))}
              </div>
            )}
            {isAuthenticated && !resultsLoading && screeningResults && screeningResults.length > 0 && (
              <div className="mt-6">
                <PastResultsSection results={screeningResults} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="library">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap mb-4" data-testid="section-product-filters">
              <Button
                variant={selectedProductLine === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedProductLine(null)}
                data-testid="button-filter-all"
              >
                All
              </Button>
              {(productLines || []).map((pl) => (
                <Button
                  key={pl.id}
                  variant={selectedProductLine === pl.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProductLine(pl.id)}
                  data-testid={`button-filter-${pl.id}`}
                >
                  {pl.name}
                </Button>
              ))}
            </div>

            {resourcesLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(filteredResources || []).map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </div>
            )}
            {filteredResources && filteredResources.length === 0 && (
              <Card className="p-8 text-center" data-testid="card-no-resources">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No resources found for this product line.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="space-y-6">
            <HealthResourcesMap />
            <Card className="p-5" data-testid="card-grant-positioning">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-violet-500" /> Integrated Behavioral Health & Workforce Development
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                ThriveUp's Health & Wellness hub demonstrates the integration of behavioral health services with workforce development — a key requirement for SAMHSA, HHS, and DOL grants that address social determinants of health.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className="p-3 rounded-md bg-muted/50 text-center">
                  <ClipboardCheck className="h-5 w-5 mx-auto text-indigo-500 mb-1" />
                  <p className="text-xs font-medium">Self-Assessments</p>
                  <p className="text-xs text-muted-foreground">3 Structured Tools</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50 text-center">
                  <BookOpen className="h-5 w-5 mx-auto text-violet-500 mb-1" />
                  <p className="text-xs font-medium">Wellness Library</p>
                  <p className="text-xs text-muted-foreground">5 Product Lines</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50 text-center">
                  <MapPin className="h-5 w-5 mx-auto text-rose-500 mb-1" />
                  <p className="text-xs font-medium">Resource Mapping</p>
                  <p className="text-xs text-muted-foreground">GIS Integration</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
