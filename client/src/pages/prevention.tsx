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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import {
  Shield, BookOpen, ChevronRight, CheckCircle2, AlertTriangle,
  ArrowLeft, ClipboardCheck, BarChart3, ExternalLink, FileText,
  Heart, Users, Brain, Activity, Target,
} from "lucide-react";
import type { PreventionModule, PreventionProgress as PreventionProgressType, RiskAssessment, YouthSurvey } from "@shared/schema";

interface DashboardData {
  totalModules: number;
  completedModules: number;
  totalAssessments: number;
  totalSurveyResponses: number;
}

interface RiskQuestion {
  id: string;
  domain: string;
  text: string;
  options: string[];
  scores: number[];
}

interface RiskQuestions {
  risk: RiskQuestion[];
  protective: RiskQuestion[];
}

function ModuleCard({ mod, progress, onStart }: { mod: PreventionModule; progress?: PreventionProgressType; onStart: (id: string) => void }) {
  const isCompleted = progress?.status === "completed";
  const isInProgress = progress?.status === "in_progress";
  return (
    <Card className="p-4" data-testid={`card-module-${mod.id}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-md p-2 bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
          <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm" data-testid={`text-module-title-${mod.id}`}>{mod.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">{mod.ageGroup}</Badge>
          <Badge variant="outline" className="text-[10px]">{mod.substanceTopic}</Badge>
          {isCompleted && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Completed</Badge>}
          {isInProgress && <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">In Progress</Badge>}
        </div>
        <Button size="sm" onClick={() => onStart(mod.id)} data-testid={`button-start-module-${mod.id}`}>
          {isCompleted ? "Review" : isInProgress ? "Continue" : "Start"} <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function ModuleDetail({ mod, onBack, onComplete }: { mod: PreventionModule; onBack: () => void; onComplete: (score: number) => void }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResponses, setQuizResponses] = useState<Record<string, number>>({});
  const sections = (mod.contentSections as Array<{ title: string; content: string }>) || [];
  const objectives = (mod.learningObjectives as string[]) || [];
  const questions = (mod.knowledgeCheckQuestions as Array<{ id: string; text: string; options: string[]; correctAnswer: number }>) || [];

  const handleQuizAnswer = (qId: string, idx: number) => {
    setQuizResponses({ ...quizResponses, [qId]: idx });
  };

  const handleSubmitQuiz = () => {
    let correct = 0;
    for (const q of questions) {
      if (quizResponses[q.id] === q.correctAnswer) correct++;
    }
    const score = Math.round((correct / questions.length) * 100);
    onComplete(score);
  };

  const allAnswered = questions.length > 0 && Object.keys(quizResponses).length === questions.length;

  return (
    <div className="max-w-3xl mx-auto" data-testid="section-module-detail">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4" data-testid="button-back-to-modules">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Curriculum
      </Button>
      <h2 className="text-xl font-bold mb-2" data-testid="text-module-detail-title">{mod.title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{mod.description}</p>

      {objectives.length > 0 && (
        <Card className="p-4 mb-4" data-testid="card-objectives">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" /> Learning Objectives
          </h3>
          <ul className="space-y-1">
            {objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-objective-${i}`}>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!showQuiz ? (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Section {currentSection + 1} of {sections.length}</span>
              <span>{Math.round(((currentSection + 1) / sections.length) * 100)}%</span>
            </div>
            <Progress value={((currentSection + 1) / sections.length) * 100} className="h-2" data-testid="progress-section" />
          </div>

          {sections[currentSection] && (
            <Card className="p-5 mb-4" data-testid="card-section-content">
              <h3 className="font-semibold mb-3">{sections[currentSection].title}</h3>
              <p className="text-sm leading-relaxed">{sections[currentSection].content}</p>
            </Card>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" disabled={currentSection === 0} onClick={() => setCurrentSection(currentSection - 1)} data-testid="button-prev-section">
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            {currentSection < sections.length - 1 ? (
              <Button size="sm" onClick={() => setCurrentSection(currentSection + 1)} data-testid="button-next-section">
                Next <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowQuiz(true)} data-testid="button-take-quiz">
                Take Knowledge Check <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </>
      ) : (
        <div data-testid="section-knowledge-check">
          <h3 className="font-semibold text-lg mb-4">Knowledge Check</h3>
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <Card key={q.id} className="p-4" data-testid={`card-quiz-question-${qi}`}>
                <p className="text-sm font-medium mb-3">{q.text}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <Button
                      key={oi}
                      variant={quizResponses[q.id] === oi ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto py-2.5 px-3"
                      onClick={() => handleQuizAnswer(q.id, oi)}
                      data-testid={`button-quiz-option-${qi}-${oi}`}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button disabled={!allAnswered} onClick={handleSubmitQuiz} data-testid="button-submit-quiz">
              Submit Answers
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AssessmentTaker({ type, questions, onComplete, onCancel }: {
  type: "risk" | "protective";
  questions: RiskQuestion[];
  onComplete: (responses: Record<string, number>) => void;
  onCancel: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const q = questions[currentQ];

  const handleAnswer = (idx: number) => {
    const newResponses = { ...responses, [q.id]: idx };
    setResponses(newResponses);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      onComplete(newResponses);
    }
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="section-assessment-taker">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-assessment">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="font-semibold text-lg">{type === "risk" ? "Risk Factor Assessment" : "Protective Factor Assessment"}</h2>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
        </div>
        <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" data-testid="progress-assessment" />
      </div>

      <Card className="p-6" data-testid="card-current-question">
        <Badge variant="secondary" className="text-[10px] mb-3">{q.domain.replace(/_/g, " ")}</Badge>
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
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => setCurrentQ(currentQ - 1)} data-testid="button-prev-question">
          <ArrowLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
      )}
    </div>
  );
}

function AssessmentResultView({ assessment, onDismiss }: { assessment: RiskAssessment; onDismiss: () => void }) {
  const isRisk = assessment.assessmentType === "risk";
  const score = isRisk ? assessment.riskScore : assessment.protectiveScore;
  const maxScore = 36;
  const pct = Math.round((score / maxScore) * 100);
  const recommendations = (assessment.recommendations as string[]) || [];

  return (
    <div className="max-w-2xl mx-auto" data-testid="section-assessment-result">
      <Button variant="ghost" size="sm" onClick={onDismiss} className="mb-4" data-testid="button-back-to-assessments">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <Card className="p-6" data-testid="card-result-summary">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-3">
            <CheckCircle2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold mb-1" data-testid="text-result-title">
            {isRisk ? "Risk Factor Assessment Complete" : "Protective Factor Assessment Complete"}
          </h2>
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{isRisk ? "Risk Score" : "Protective Score"}</span>
            <span className="font-semibold">{score} / {maxScore}</span>
          </div>
          <Progress value={pct} className="h-3" data-testid="progress-result-score" />
          <p className="text-xs text-muted-foreground mt-2">
            {isRisk
              ? (pct >= 60 ? "Elevated risk factors identified. See recommendations below." : pct >= 40 ? "Moderate risk factors present." : "Low risk factors. Keep building protective factors!")
              : (pct >= 70 ? "Strong protective factors! Keep it up." : pct >= 40 ? "Good protective factors. Consider strengthening key areas." : "Focus on building protective factors.")}
          </p>
        </div>
        {recommendations.length > 0 && (
          <div data-testid="section-recommendations">
            <h3 className="font-semibold text-sm mb-3">Recommendations</h3>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-recommendation-${i}`}>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-6 border-t pt-4" data-testid="text-disclaimer">
          This assessment is for educational and informational purposes only. It is not a clinical evaluation. If you or someone you know needs help, contact SAMHSA's National Helpline at 1-800-662-4357.
        </p>
      </Card>
    </div>
  );
}

function SurveyTaker({ survey, onSubmit, onCancel }: {
  survey: YouthSurvey;
  onSubmit: (responses: Record<string, number>, demographics: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const questions = (survey.questions as Array<{ id: string; text: string; options: string[] }>) || [];
  const q = questions[currentQ];

  const handleAnswer = (idx: number) => {
    const newResponses = { ...responses, [q.id]: idx };
    setResponses(newResponses);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      onSubmit(newResponses, {});
    }
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="section-survey-taker">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-survey">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="font-semibold text-lg">{survey.title}</h2>
          <p className="text-xs text-muted-foreground">Anonymous survey - no identifying data collected</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
        </div>
        <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" data-testid="progress-survey" />
      </div>

      <Card className="p-6" data-testid="card-survey-question">
        <p className="text-base font-medium mb-6" data-testid="text-survey-question">{q.text}</p>
        <div className="space-y-3">
          {q.options.map((option, i) => (
            <Button
              key={i}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4"
              onClick={() => handleAnswer(i)}
              data-testid={`button-survey-option-${i}`}
            >
              {option}
            </Button>
          ))}
        </div>
      </Card>

      {currentQ > 0 && (
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => setCurrentQ(currentQ - 1)} data-testid="button-prev-survey-question">
          <ArrowLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
      )}
    </div>
  );
}

const RESOURCES = [
  { name: "SAMHSA National Helpline", url: "https://www.samhsa.gov/find-help/national-helpline", desc: "Free, confidential, 24/7 treatment referral and information service: 1-800-662-4357" },
  { name: "NIDA for Teens", url: "https://teens.drugabuse.gov/", desc: "National Institute on Drug Abuse resources specifically for young people" },
  { name: "CDC Youth Substance Use Prevention", url: "https://www.cdc.gov/substance-use-prevention/youth/index.html", desc: "Evidence-based prevention strategies and data from the CDC" },
  { name: "Communities That Care", url: "https://www.communitiesthatcare.net/", desc: "A coalition-based prevention system for reducing youth substance use" },
  { name: "Too Smart to Start", url: "https://www.samhsa.gov/underage-drinking", desc: "SAMHSA resources on underage drinking prevention" },
  { name: "Truth Initiative", url: "https://truthinitiative.org/", desc: "Leading organization dedicated to ending tobacco and nicotine use among youth" },
];

export default function PreventionPage() {
  useEffect(() => { document.title = "Substance Prevention | ThriveUp"; }, []);

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [activeAssessment, setActiveAssessment] = useState<"risk" | "protective" | null>(null);
  const [latestResult, setLatestResult] = useState<RiskAssessment | null>(null);
  const [activeSurvey, setActiveSurvey] = useState<string | null>(null);
  const [surveyComplete, setSurveyComplete] = useState(false);
  const [ageFilter, setAgeFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");

  const { data: dashboard, isLoading: dashLoading } = useQuery<DashboardData>({ queryKey: ["/api/prevention/dashboard"] });

  const queryParams = new URLSearchParams();
  if (ageFilter !== "all") queryParams.set("ageGroup", ageFilter);
  if (topicFilter !== "all") queryParams.set("topic", topicFilter);
  const modulesUrl = `/api/prevention/modules${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const { data: modules, isLoading: modsLoading } = useQuery<PreventionModule[]>({
    queryKey: ["/api/prevention/modules", ageFilter, topicFilter],
    queryFn: () => fetch(modulesUrl, { credentials: "include" }).then(r => r.json()),
  });

  const { data: progress } = useQuery<PreventionProgressType[]>({
    queryKey: ["/api/prevention/progress"],
    enabled: isAuthenticated,
  });

  const { data: riskQuestions } = useQuery<RiskQuestions>({ queryKey: ["/api/prevention/risk-questions"] });

  const { data: assessments } = useQuery<RiskAssessment[]>({
    queryKey: ["/api/prevention/risk-assessments"],
    enabled: isAuthenticated,
  });

  const { data: surveys } = useQuery<YouthSurvey[]>({ queryKey: ["/api/prevention/surveys"] });

  const progressMutation = useMutation({
    mutationFn: async (data: { moduleId: string; status: string; score: number }) => {
      const res = await apiRequest("POST", "/api/prevention/progress", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/dashboard"] });
      toast({ title: "Progress Saved", description: "Your module progress has been updated." });
    },
  });

  const assessmentMutation = useMutation({
    mutationFn: async (data: { assessmentType: string; responses: Record<string, number> }) => {
      const res = await apiRequest("POST", "/api/prevention/risk-assessments", data);
      return res.json();
    },
    onSuccess: (result: RiskAssessment) => {
      setLatestResult(result);
      setActiveAssessment(null);
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/risk-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/dashboard"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const surveyMutation = useMutation({
    mutationFn: async (data: { surveyId: string; responses: Record<string, number>; demographicData: Record<string, string> }) => {
      const res = await apiRequest("POST", "/api/prevention/survey-responses", data);
      return res.json();
    },
    onSuccess: () => {
      setSurveyComplete(true);
      setActiveSurvey(null);
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/dashboard"] });
      toast({ title: "Survey Submitted", description: "Thank you for your anonymous response!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const selectedModuleData = modules?.find(m => m.id === selectedModule);
  const activeSurveyData = surveys?.find(s => s.id === activeSurvey);

  const handleStartModule = (id: string) => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to track your progress.", variant: "destructive" });
    }
    setSelectedModule(id);
    setActiveTab("curriculum");
    if (isAuthenticated) {
      progressMutation.mutate({ moduleId: id, status: "in_progress", score: 0 });
    }
  };

  const handleCompleteModule = (score: number) => {
    if (selectedModule && isAuthenticated) {
      progressMutation.mutate({ moduleId: selectedModule, status: "completed", score });
    }
    toast({ title: "Module Complete!", description: `You scored ${score}%` });
    setSelectedModule(null);
  };

  const handleStartAssessment = (type: "risk" | "protective") => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to take an assessment.", variant: "destructive" });
      return;
    }
    setActiveAssessment(type);
    setLatestResult(null);
    setActiveTab(type === "risk" ? "risk" : "protective");
  };

  const handleCompleteAssessment = (responses: Record<string, number>) => {
    if (!activeAssessment) return;
    assessmentMutation.mutate({ assessmentType: activeAssessment, responses });
  };

  const handleStartSurvey = (surveyId: string) => {
    setActiveSurvey(surveyId);
    setSurveyComplete(false);
    setActiveTab("survey");
  };

  const handleSubmitSurvey = (responses: Record<string, number>, demographics: Record<string, string>) => {
    if (!activeSurvey) return;
    surveyMutation.mutate({ surveyId: activeSurvey, responses, demographicData: demographics });
  };

  if (selectedModuleData) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="prevention-page">
        <PageHeader title="Substance Prevention" breadcrumbs={[{ label: "Prevention", href: "/prevention" }, { label: selectedModuleData.title }]} />
        <ModuleDetail mod={selectedModuleData} onBack={() => setSelectedModule(null)} onComplete={handleCompleteModule} />
      </div>
    );
  }

  if (activeAssessment && riskQuestions) {
    const questions = activeAssessment === "risk" ? riskQuestions.risk : riskQuestions.protective;
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="prevention-page">
        <PageHeader title="Substance Prevention" breadcrumbs={[{ label: "Prevention", href: "/prevention" }, { label: activeAssessment === "risk" ? "Risk Assessment" : "Protective Factors" }]} />
        <AssessmentTaker type={activeAssessment} questions={questions} onComplete={handleCompleteAssessment} onCancel={() => setActiveAssessment(null)} />
      </div>
    );
  }

  if (latestResult) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="prevention-page">
        <PageHeader title="Substance Prevention" breadcrumbs={[{ label: "Prevention", href: "/prevention" }, { label: "Results" }]} />
        <AssessmentResultView assessment={latestResult} onDismiss={() => setLatestResult(null)} />
      </div>
    );
  }

  if (activeSurveyData) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="prevention-page">
        <PageHeader title="Substance Prevention" breadcrumbs={[{ label: "Prevention", href: "/prevention" }, { label: "Youth Survey" }]} />
        <SurveyTaker survey={activeSurveyData} onSubmit={handleSubmitSurvey} onCancel={() => setActiveSurvey(null)} />
      </div>
    );
  }

  if (surveyComplete) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="prevention-page">
        <PageHeader title="Substance Prevention" breadcrumbs={[{ label: "Prevention", href: "/prevention" }, { label: "Survey Complete" }]} />
        <div className="max-w-2xl mx-auto text-center" data-testid="section-survey-complete">
          <Card className="p-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-4">Your anonymous survey response has been recorded. This data helps our community build better prevention programs.</p>
            <Button onClick={() => { setSurveyComplete(false); setActiveTab("overview"); }} data-testid="button-back-to-prevention">
              Back to Prevention Hub
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="prevention-page">
      <PageHeader title="Youth Substance Prevention" breadcrumbs={[{ label: "Prevention" }]} />

      <div className="rounded-md bg-gradient-to-r from-emerald-900 to-teal-700 p-4 sm:p-6 lg:p-8 mb-8" data-testid="section-hero">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="rounded-md p-2.5 bg-white/10">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-page-title">
            Youth Substance Prevention
          </h1>
        </div>
        <p className="text-emerald-100 text-base sm:text-lg" data-testid="text-page-subtitle">
          Evidence-based prevention curriculum, risk assessments, and community surveys aligned with DFC grant requirements
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6" data-testid="tabs-prevention">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum" data-testid="tab-curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="risk" data-testid="tab-risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="protective" data-testid="tab-protective">Protective Factors</TabsTrigger>
          <TabsTrigger value="survey" data-testid="tab-survey">Youth Survey</TabsTrigger>
          <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="section-stats">
              {dashLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
              ) : (
                <>
                  <Card className="p-4 text-center" data-testid="stat-total-modules">
                    <BookOpen className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                    <p className="text-2xl font-bold">{dashboard?.totalModules || 0}</p>
                    <p className="text-xs text-muted-foreground">Curriculum Modules</p>
                  </Card>
                  <Card className="p-4 text-center" data-testid="stat-completed">
                    <CheckCircle2 className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-2xl font-bold">{dashboard?.completedModules || 0}</p>
                    <p className="text-xs text-muted-foreground">Completions</p>
                  </Card>
                  <Card className="p-4 text-center" data-testid="stat-assessments">
                    <ClipboardCheck className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                    <p className="text-2xl font-bold">{dashboard?.totalAssessments || 0}</p>
                    <p className="text-xs text-muted-foreground">Assessments Taken</p>
                  </Card>
                  <Card className="p-4 text-center" data-testid="stat-surveys">
                    <Users className="h-5 w-5 mx-auto text-violet-500 mb-1" />
                    <p className="text-2xl font-bold">{dashboard?.totalSurveyResponses || 0}</p>
                    <p className="text-xs text-muted-foreground">Survey Responses</p>
                  </Card>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 cursor-pointer hover-elevate" onClick={() => setActiveTab("curriculum")} data-testid="card-goto-curriculum">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-md p-2 bg-emerald-100 dark:bg-emerald-900/30">
                    <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-sm">Prevention Curriculum</h3>
                </div>
                <p className="text-xs text-muted-foreground">8 evidence-based modules across 3 age tiers covering alcohol, cannabis, vaping, opioids, and more.</p>
              </Card>
              <Card className="p-5 cursor-pointer hover-elevate" onClick={() => handleStartAssessment("risk")} data-testid="card-goto-risk">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-md p-2 bg-amber-100 dark:bg-amber-900/30">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-sm">Risk Assessment</h3>
                </div>
                <p className="text-xs text-muted-foreground">Evaluate risk factors across family, peer, community, and individual domains.</p>
              </Card>
              <Card className="p-5 cursor-pointer hover-elevate" onClick={() => handleStartAssessment("protective")} data-testid="card-goto-protective">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-md p-2 bg-blue-100 dark:bg-blue-900/30">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-sm">Protective Factors</h3>
                </div>
                <p className="text-xs text-muted-foreground">Assess strengths in family bonding, school engagement, refusal skills, and mentorship.</p>
              </Card>
            </div>

            {assessments && assessments.length > 0 && (
              <div data-testid="section-past-assessments">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" /> Recent Assessments
                </h3>
                <div className="space-y-2">
                  {assessments.slice(0, 5).map((a) => (
                    <Card key={a.id} className="p-3 flex items-center justify-between gap-2" data-testid={`card-past-assessment-${a.id}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <ClipboardCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{a.assessmentType === "risk" ? "Risk Factor" : "Protective Factor"} Assessment</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-[10px]">
                          Score: {a.assessmentType === "risk" ? a.riskScore : a.protectiveScore}/36
                        </Badge>
                        {a.completedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="curriculum">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger className="w-40" data-testid="select-age-filter">
                  <SelectValue placeholder="Age Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="10-14">Ages 10-14</SelectItem>
                  <SelectItem value="15-18">Ages 15-18</SelectItem>
                  <SelectItem value="19-24">Ages 19-24</SelectItem>
                </SelectContent>
              </Select>
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-48" data-testid="select-topic-filter">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  <SelectItem value="alcohol">Alcohol</SelectItem>
                  <SelectItem value="cannabis">Cannabis</SelectItem>
                  <SelectItem value="vaping">Vaping</SelectItem>
                  <SelectItem value="prescription">Prescription Drugs</SelectItem>
                  <SelectItem value="fentanyl">Fentanyl & Opioids</SelectItem>
                  <SelectItem value="refusal">Refusal Skills</SelectItem>
                  <SelectItem value="media">Media Literacy</SelectItem>
                  <SelectItem value="coping">Coping Strategies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {modsLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
            ) : modules && modules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="section-modules-grid">
                {modules.map((mod) => (
                  <ModuleCard
                    key={mod.id}
                    mod={mod}
                    progress={progress?.find(p => p.moduleId === mod.id)}
                    onStart={handleStartModule}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center" data-testid="section-no-modules">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No modules found for the selected filters.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-5" data-testid="card-risk-intro">
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-md p-2 bg-amber-100 dark:bg-amber-900/30 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Risk Factor Assessment</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This assessment evaluates risk factors across 4 domains: family, peer/social, community, and individual. Understanding your risk factors helps identify areas where additional support may be beneficial.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {["Family", "Peer/Social", "Community", "Individual"].map((domain) => (
                  <div key={domain} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{domain}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => handleStartAssessment("risk")} data-testid="button-start-risk">
                Begin Risk Assessment <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="protective">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-5" data-testid="card-protective-intro">
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-md p-2 bg-blue-100 dark:bg-blue-900/30 shrink-0">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Protective Factor Assessment</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Evaluate your protective strengths across family bonding, school engagement, prosocial involvement, refusal skills, coping strategies, and adult mentorship.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {["Family Bonding", "School Engagement", "Prosocial Involvement", "Refusal Skills", "Coping Strategies", "Adult Mentorship"].map((domain) => (
                  <div key={domain} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{domain}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => handleStartAssessment("protective")} data-testid="button-start-protective">
                Begin Protective Factor Assessment <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="survey">
          <div className="max-w-2xl mx-auto space-y-4">
            <Card className="p-5" data-testid="card-survey-intro">
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-md p-2 bg-violet-100 dark:bg-violet-900/30 shrink-0">
                  <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Anonymous Youth Surveys</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Help your community understand substance use perceptions. All surveys are completely anonymous - no personal information is collected.
                  </p>
                </div>
              </div>
            </Card>
            {surveys && surveys.length > 0 ? (
              surveys.map((survey) => (
                <Card key={survey.id} className="p-4" data-testid={`card-survey-${survey.id}`}>
                  <h4 className="font-semibold text-sm mb-1" data-testid={`text-survey-title-${survey.id}`}>{survey.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{survey.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {(survey.questions as unknown[])?.length || 0} questions
                    </Badge>
                    <Button size="sm" onClick={() => handleStartSurvey(survey.id)} data-testid={`button-start-survey-${survey.id}`}>
                      Take Survey <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center" data-testid="section-no-surveys">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No active surveys available at this time.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="max-w-2xl mx-auto space-y-4">
            <Card className="p-5 mb-4" data-testid="card-resources-intro">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" /> Evidence-Based Resources
              </h3>
              <p className="text-sm text-muted-foreground">
                These resources are from nationally recognized organizations focused on youth substance use prevention.
              </p>
            </Card>
            {RESOURCES.map((resource, i) => (
              <Card key={i} className="p-4" data-testid={`card-resource-${i}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-md p-2 bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                    <ExternalLink className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm" data-testid={`text-resource-name-${i}`}>{resource.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{resource.desc}</p>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 mt-2" data-testid={`link-resource-${i}`}>
                      Visit Resource <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
