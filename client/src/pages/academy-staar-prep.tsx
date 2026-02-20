import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, BookOpen, GraduationCap, Star, Trophy, Target,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock,
  Brain, Lightbulb, TrendingUp, BarChart3, BookMarked,
  Sparkles, AlertTriangle, Zap, FileText,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STAAR_GRADES = [
  { grade: 3, name: "Grade 3", subjects: ["Math", "RLA"] },
  { grade: 4, name: "Grade 4", subjects: ["Math", "RLA"] },
  { grade: 5, name: "Grade 5", subjects: ["Math", "RLA", "Science"] },
  { grade: 6, name: "Grade 6", subjects: ["Math", "RLA"] },
  { grade: 7, name: "Grade 7", subjects: ["Math", "RLA"] },
  { grade: 8, name: "Grade 8", subjects: ["Math", "RLA", "Science", "Social Studies"] },
  { grade: 9, name: "Algebra I (EOC)", subjects: ["Algebra I"] },
  { grade: 9, name: "English I (EOC)", subjects: ["English I"], gradeKey: "9-eng" },
  { grade: 10, name: "English II / Biology (EOC)", subjects: ["English II", "Biology"] },
  { grade: 11, name: "U.S. History (EOC)", subjects: ["U.S. History"] },
];

const MASTERY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  mastered: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Mastered" },
  proficient: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Proficient" },
  developing: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Developing" },
  needs_practice: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Needs Practice" },
  not_started: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", label: "Not Started" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default function AcademyStaarPrepPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedGradeIdx, setSelectedGradeIdx] = useState(3);
  const [selectedSubject, setSelectedSubject] = useState("Math");
  const [activeTab, setActiveTab] = useState("study");
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [assessmentMode, setAssessmentMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<Array<{ questionId: string; tekCode: string; topicName: string; selected: string; correct: boolean }>>([]);
  const [showResult, setShowResult] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentStartTime, setAssessmentStartTime] = useState<number>(0);

  const currentGradeInfo = STAAR_GRADES[selectedGradeIdx];
  const currentGrade = currentGradeInfo.grade;

  const { data: guides = [], isLoading: guidesLoading } = useQuery<any[]>({
    queryKey: ["/api/staar/guides", currentGrade, selectedSubject],
    queryFn: () => fetch(`/api/staar/guides?grade=${currentGrade}&subject=${encodeURIComponent(selectedSubject)}`).then(r => r.json()),
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<any[]>({
    queryKey: ["/api/staar/questions", currentGrade, selectedSubject],
    queryFn: () => fetch(`/api/staar/questions?grade=${currentGrade}&subject=${encodeURIComponent(selectedSubject)}`).then(r => r.json()),
    enabled: activeTab === "practice",
  });

  const { data: masteryRaw = [] } = useQuery<any[]>({
    queryKey: ["/api/staar/mastery", currentGrade, selectedSubject],
    queryFn: () => fetch(`/api/staar/mastery?grade=${currentGrade}&subject=${encodeURIComponent(selectedSubject)}`).then(r => r.json()),
    enabled: activeTab === "progress",
  });
  const mastery = Array.isArray(masteryRaw) ? masteryRaw : [];

  const { data: assessmentHistoryRaw = [] } = useQuery<any[]>({
    queryKey: ["/api/staar/assessments", currentGrade, selectedSubject],
    queryFn: () => fetch(`/api/staar/assessments?grade=${currentGrade}&subject=${encodeURIComponent(selectedSubject)}`).then(r => r.json()),
    enabled: activeTab === "progress",
  });
  const assessmentHistory = Array.isArray(assessmentHistoryRaw) ? assessmentHistoryRaw : [];

  const submitAssessment = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/staar/assessments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staar/mastery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staar/assessments"] });
    },
  });

  function handleGradeChange(idx: number) {
    setSelectedGradeIdx(idx);
    setSelectedSubject(STAAR_GRADES[idx].subjects[0]);
    setAssessmentMode(false);
    setAssessmentComplete(false);
    setExpandedGuide(null);
  }

  function startAssessment() {
    setAssessmentMode(true);
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setAnswers([]);
    setShowResult(false);
    setAssessmentComplete(false);
    setAssessmentStartTime(Date.now());
  }

  function handleAnswerSelect(value: string) {
    setSelectedAnswer(value);
  }

  function handleSubmitAnswer() {
    if (!selectedAnswer || !questions[currentQuestion]) return;
    const q = questions[currentQuestion];
    const isCorrect = selectedAnswer === q.correctAnswer;
    const newAnswers = [...answers, {
      questionId: q.id,
      tekCode: q.tekCode,
      topicName: guides.find((g: any) => g.tekCode === q.tekCode)?.topicName || q.tekCode,
      selected: selectedAnswer,
      correct: isCorrect,
    }];
    setAnswers(newAnswers);
    setShowResult(true);
  }

  function handleNextQuestion() {
    if (currentQuestion + 1 >= questions.length) {
      const correctCount = answers.filter(a => a.correct).length;
      const scorePercent = Math.round((correctCount / answers.length) * 100);
      const strengths = Array.from(new Set(answers.filter(a => a.correct).map(a => a.topicName)));
      const weaknesses = Array.from(new Set(answers.filter(a => !a.correct).map(a => a.topicName)));
      submitAssessment.mutate({
        grade: currentGrade,
        subject: selectedSubject,
        totalQuestions: answers.length,
        correctAnswers: correctCount,
        scorePercent,
        timeSpentSeconds: Math.round((Date.now() - assessmentStartTime) / 1000),
        answers: answers.map(a => ({ tekCode: a.tekCode, topicName: a.topicName, correct: a.correct })),
        strengths,
        weaknesses,
      });
      setAssessmentComplete(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
      setShowResult(false);
    }
  }

  const correctCount = answers.filter(a => a.correct).length;
  const scorePercent = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-rose-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            className="text-white/80 hover:text-white mb-4"
            onClick={() => navigate("/academy")}
            data-testid="button-back-academy"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Academy
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg p-2 bg-white/10">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-hero-title">
                TX STAAR Test Prep
              </h1>
              <p className="text-rose-100 text-sm sm:text-base" data-testid="text-hero-subtitle">
                Grade-level study guides, practice assessments, and personalized learning -- aligned to Texas Essential Knowledge and Skills (TEKS)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Badge variant="outline" className="border-white/30 text-white text-xs">
              <Star className="h-3 w-3 mr-1" /> Grades 3-12
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white text-xs">
              <Target className="h-3 w-3 mr-1" /> TEKS-Aligned
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white text-xs">
              <Brain className="h-3 w-3 mr-1" /> Personalized
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Card data-testid="card-grade-selector">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-primary" />
              Select Your Grade & Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Grade Level</p>
              <div className="flex flex-wrap gap-2">
                {STAAR_GRADES.map((g, idx) => (
                  <Button
                    key={g.gradeKey || `${g.grade}-${g.subjects[0]}`}
                    variant={selectedGradeIdx === idx ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleGradeChange(idx)}
                    data-testid={`button-grade-${g.gradeKey || g.grade}`}
                    className="text-xs"
                  >
                    {g.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Subject</p>
              <div className="flex flex-wrap gap-2">
                {currentGradeInfo.subjects.map((subj) => (
                  <Button
                    key={subj}
                    variant={selectedSubject === subj ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelectedSubject(subj); setAssessmentMode(false); setAssessmentComplete(false); }}
                    data-testid={`button-subject-${subj.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-xs"
                  >
                    {subj}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setAssessmentMode(false); setAssessmentComplete(false); }}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="study" data-testid="tab-study">
              <BookOpen className="h-4 w-4 mr-1" /> Study Guide
            </TabsTrigger>
            <TabsTrigger value="practice" data-testid="tab-practice">
              <FileText className="h-4 w-4 mr-1" /> Practice Test
            </TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">
              <BarChart3 className="h-4 w-4 mr-1" /> My Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="study" className="mt-4 space-y-4">
            {guidesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
                  </Card>
                ))}
              </div>
            ) : guides.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No study guides available yet for {currentGradeInfo.name} {selectedSubject}.</p>
              </Card>
            ) : (
              guides.map((guide: any) => (
                <Card key={guide.id} className="overflow-hidden" data-testid={`card-guide-${guide.tekCode}`}>
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                    data-testid={`button-expand-${guide.tekCode}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">{guide.tekCode}</Badge>
                          <Badge className={`text-xs ${DIFFICULTY_COLORS[guide.difficultyLevel]}`}>
                            {guide.difficultyLevel}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-sm mt-1">{guide.topicName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{guide.tekDescription}</p>
                      </div>
                      {expandedGuide === guide.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedGuide === guide.id && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-muted/20">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Study Content
                        </h4>
                        <p className="text-sm leading-relaxed">{guide.content}</p>
                      </div>
                      {guide.keyVocabulary && guide.keyVocabulary.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Key Vocabulary
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {guide.keyVocabulary.map((word: string) => (
                              <Badge key={word} variant="secondary" className="text-xs">{word}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {guide.studyTips && guide.studyTips.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" /> Study Tips
                          </h4>
                          <ul className="space-y-1">
                            {guide.studyTips.map((tip: string, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <Zap className="h-3 w-3 mt-1 text-amber-500 shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="practice" className="mt-4">
            {!assessmentMode && !assessmentComplete && (
              <Card className="p-6 text-center" data-testid="card-start-assessment">
                <FileText className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">Practice Assessment</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {currentGradeInfo.name} - {selectedSubject}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {questionsLoading ? "Loading questions..." : `${questions.length} questions available`}
                </p>
                <Button onClick={startAssessment} disabled={questionsLoading || questions.length === 0} data-testid="button-start-assessment">
                  <Target className="h-4 w-4 mr-2" /> Start Practice Test
                </Button>
              </Card>
            )}

            {assessmentMode && !assessmentComplete && questions[currentQuestion] && (
              <Card data-testid="card-question">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Question {currentQuestion + 1} of {questions.length}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-mono">
                      {questions[currentQuestion].tekCode}
                    </Badge>
                  </div>
                  <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium" data-testid="text-question">
                    {questions[currentQuestion].questionText}
                  </p>
                  <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} disabled={showResult}>
                    {(questions[currentQuestion].options as string[]).map((opt: string, i: number) => (
                      <div
                        key={i}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                          showResult
                            ? opt === questions[currentQuestion].correctAnswer
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                              : opt === selectedAnswer && opt !== questions[currentQuestion].correctAnswer
                                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                : "border-border"
                            : selectedAnswer === opt
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                        }`}
                        data-testid={`option-${i}`}
                      >
                        <RadioGroupItem value={opt} id={`opt-${i}`} />
                        <Label htmlFor={`opt-${i}`} className="text-sm cursor-pointer flex-1">{opt}</Label>
                        {showResult && opt === questions[currentQuestion].correctAnswer && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                        {showResult && opt === selectedAnswer && opt !== questions[currentQuestion].correctAnswer && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    ))}
                  </RadioGroup>

                  {showResult && (
                    <Card className={`p-3 ${answers[answers.length - 1]?.correct ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" : "bg-red-50 dark:bg-red-900/20 border-red-200"}`}>
                      <div className="flex items-start gap-2">
                        {answers[answers.length - 1]?.correct ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-semibold mb-0.5">
                            {answers[answers.length - 1]?.correct ? "Correct!" : "Not quite right"}
                          </p>
                          <p className="text-xs text-muted-foreground">{questions[currentQuestion].explanation}</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setAssessmentMode(false); setAssessmentComplete(false); }}
                      data-testid="button-quit-assessment"
                    >
                      Quit
                    </Button>
                    {!showResult ? (
                      <Button size="sm" onClick={handleSubmitAnswer} disabled={!selectedAnswer} data-testid="button-submit-answer">
                        Check Answer
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleNextQuestion} data-testid="button-next-question">
                        {currentQuestion + 1 >= questions.length ? "See Results" : "Next Question"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {assessmentComplete && (
              <Card data-testid="card-assessment-results">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className={`h-5 w-5 ${scorePercent >= 70 ? "text-amber-500" : "text-muted-foreground"}`} />
                    Assessment Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <div className={`text-5xl font-bold mb-1 ${scorePercent >= 80 ? "text-emerald-600" : scorePercent >= 60 ? "text-amber-600" : "text-red-600"}`}>
                      {scorePercent}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {correctCount} of {answers.length} correct
                    </p>
                    <Badge className={`mt-2 ${scorePercent >= 80 ? "bg-emerald-100 text-emerald-800" : scorePercent >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                      {scorePercent >= 80 ? "Masters Grade Level" : scorePercent >= 60 ? "Meets Grade Level" : scorePercent >= 40 ? "Approaches Grade Level" : "Did Not Meet"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.from(new Set(answers.filter(a => a.correct).map(a => a.topicName))).length > 0 && (
                      <Card className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200">
                        <h4 className="text-xs font-semibold flex items-center gap-1 mb-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Strengths
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(answers.filter(a => a.correct).map(a => a.topicName))).map(t => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </Card>
                    )}
                    {Array.from(new Set(answers.filter(a => !a.correct).map(a => a.topicName))).length > 0 && (
                      <Card className="p-3 bg-red-50 dark:bg-red-900/20 border-red-200">
                        <h4 className="text-xs font-semibold flex items-center gap-1 mb-1 text-red-700 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" /> Areas to Review
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(answers.filter(a => !a.correct).map(a => a.topicName))).map(t => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => { setAssessmentComplete(false); setAssessmentMode(false); }} data-testid="button-back-to-start">
                      Back
                    </Button>
                    <Button onClick={startAssessment} data-testid="button-retake">
                      <Target className="h-4 w-4 mr-2" /> Retake
                    </Button>
                    <Button variant="outline" onClick={() => { setActiveTab("study"); setAssessmentComplete(false); setAssessmentMode(false); }} data-testid="button-review-guides">
                      <BookOpen className="h-4 w-4 mr-2" /> Review Study Guides
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress" className="mt-4 space-y-4">
            <Card data-testid="card-topic-mastery">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Topic Mastery - {currentGradeInfo.name} {selectedSubject}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mastery.length === 0 ? (
                  <div className="text-center py-6">
                    <Target className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No mastery data yet. Take a practice assessment to start tracking your progress!</p>
                    <Button size="sm" className="mt-3" onClick={() => setActiveTab("practice")} data-testid="button-start-practice">
                      Start Practicing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mastery.map((m: any) => {
                      const masteryInfo = MASTERY_COLORS[m.masteryLevel] || MASTERY_COLORS.not_started;
                      const pct = m.totalAttempts > 0 ? Math.round((m.correctAttempts / m.totalAttempts) * 100) : 0;
                      return (
                        <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg border" data-testid={`mastery-${m.tekCode}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">{m.tekCode}</span>
                              <span className="text-sm font-medium truncate">{m.topicName}</span>
                            </div>
                            <Progress value={pct} className="mt-1 h-1.5" />
                          </div>
                          <div className="text-right shrink-0">
                            <Badge className={`text-xs ${masteryInfo.bg} ${masteryInfo.text}`}>
                              {masteryInfo.label}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.correctAttempts}/{m.totalAttempts} ({pct}%)</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-assessment-history">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Assessment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assessmentHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No assessments completed yet.</p>
                ) : (
                  <div className="space-y-2">
                    {assessmentHistory.map((a: any) => {
                      const date = new Date(a.completedAt);
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`history-${a.id}`}>
                          <div>
                            <p className="text-sm font-medium">
                              {a.subject} - Grade {a.grade}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {a.timeSpentSeconds && ` · ${Math.floor(a.timeSpentSeconds / 60)}m ${a.timeSpentSeconds % 60}s`}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${a.scorePercent >= 80 ? "text-emerald-600" : a.scorePercent >= 60 ? "text-amber-600" : "text-red-600"}`}>
                              {a.scorePercent}%
                            </div>
                            <p className="text-xs text-muted-foreground">{a.correctAnswers}/{a.totalQuestions}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {mastery.filter((m: any) => m.masteryLevel === "needs_practice" || m.masteryLevel === "developing").length > 0 && (
              <Card className="border-amber-200 dark:border-amber-800" data-testid="card-recommendations">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Lightbulb className="h-4 w-4" />
                    Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mastery.filter((m: any) => m.masteryLevel === "needs_practice" || m.masteryLevel === "developing").map((m: any) => (
                      <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{m.topicName} ({m.tekCode})</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {m.masteryLevel === "needs_practice"
                              ? `You scored ${Math.round((m.correctAttempts / m.totalAttempts) * 100)}% on this topic. Review the study guide and practice more problems.`
                              : `Getting there! You're at ${Math.round((m.correctAttempts / m.totalAttempts) * 100)}%. A few more practice sessions will help solidify this topic.`}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 text-xs h-7"
                            onClick={() => { setActiveTab("study"); setExpandedGuide(guides.find((g: any) => g.tekCode === m.tekCode)?.id || null); }}
                            data-testid={`button-review-${m.tekCode}`}
                          >
                            <BookOpen className="h-3 w-3 mr-1" /> Review This Topic
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
