import { useState, useEffect } from "react";
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
  Sparkles, AlertTriangle, Zap, FileText, Flame, Rocket,
  PartyPopper, Medal, Heart, ThumbsUp, Award, Crown,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";

const STAAR_GRADES = [
  { grade: 3, name: "3rd Grade", subjects: ["Math", "RLA"], band: "elementary" },
  { grade: 4, name: "4th Grade", subjects: ["Math", "RLA"], band: "elementary" },
  { grade: 5, name: "5th Grade", subjects: ["Math", "RLA", "Science"], band: "elementary" },
  { grade: 6, name: "6th Grade", subjects: ["Math", "RLA"], band: "middle" },
  { grade: 7, name: "7th Grade", subjects: ["Math", "RLA"], band: "middle" },
  { grade: 8, name: "8th Grade", subjects: ["Math", "RLA", "Science", "Social Studies"], band: "middle" },
  { grade: 9, name: "Algebra I", subjects: ["Algebra I"], band: "highschool", gradeKey: "9-alg" },
  { grade: 9, name: "English I", subjects: ["English I"], band: "highschool", gradeKey: "9-eng" },
  { grade: 10, name: "English II", subjects: ["English II"], band: "highschool", gradeKey: "10-eng" },
  { grade: 10, name: "Biology", subjects: ["Biology"], band: "highschool", gradeKey: "10-bio" },
  { grade: 11, name: "U.S. History", subjects: ["U.S. History"], band: "highschool", gradeKey: "11-hist" },
];

const MASTERY_COLORS: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  mastered: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Mastered", icon: "crown" },
  proficient: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Proficient", icon: "star" },
  developing: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Developing", icon: "trending" },
  needs_practice: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Needs Practice", icon: "target" },
  not_started: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", label: "Not Started", icon: "circle" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const ENCOURAGEMENT_CORRECT = [
  "You're on fire! Keep going!",
  "Awesome work! Your brain is growing stronger!",
  "Nailed it! You're a STAAR superstar!",
  "Brilliant! That's the power of practice!",
  "Yes! You're crushing it!",
  "Amazing! One step closer to mastery!",
  "Way to go! Your hard work is paying off!",
  "Fantastic! You really know your stuff!",
];

const ENCOURAGEMENT_INCORRECT = [
  "Great effort! Mistakes help your brain grow stronger!",
  "Almost there! Now you know it for next time!",
  "That's okay! Every mistake is a learning opportunity!",
  "Keep going! The best learners learn from their mistakes!",
  "Not yet, but you're getting closer! Let's learn from this.",
  "Good try! This is how real learning happens!",
];

const FUN_FACTS: Record<string, string[]> = {
  Math: [
    "Did you know? The word 'mathematics' comes from the Greek word 'mathema' meaning 'learning'!",
    "Fun fact: A pizza that has radius 'z' and height 'a' has a volume of pi*z*z*a!",
    "Cool: The number 1 followed by 100 zeros is called a googol -- that's where Google got its name!",
    "Math power: NASA uses the same kind of math you're learning to send rockets to space!",
  ],
  RLA: [
    "Fun fact: Dr. Seuss wrote 'Green Eggs and Ham' using only 50 different words!",
    "Did you know? The word 'set' has over 400 definitions in the dictionary!",
    "Cool: Shakespeare invented over 1,700 words we still use today, like 'eyeball' and 'bedroom'!",
    "Reading power: People who read for fun score higher on ALL school subjects, not just reading!",
  ],
  Science: [
    "Amazing: Your body has about 37.2 trillion cells -- more than stars in the Milky Way!",
    "Fun fact: A tablespoon of a neutron star would weigh about 6 billion tons!",
    "Cool: Lightning is 5 times hotter than the surface of the sun!",
    "Science power: More species live in the Amazon Rainforest than scientists have even discovered yet!",
  ],
  "Social Studies": [
    "Did you know? The Liberty Bell was last rung on George Washington's birthday in 1846!",
    "Fun fact: Texas is bigger than every country in Europe except France!",
    "Cool: The U.S. Constitution is the oldest written national constitution still in use!",
    "History power: The Texas State Capitol building is actually taller than the U.S. Capitol in Washington D.C.!",
  ],
  "Algebra I": [
    "Math power: Al-Khwarizmi, the 'father of algebra,' wrote the first algebra textbook in 820 AD!",
    "Fun fact: The '=' sign was invented in 1557 by Robert Recorde because he was tired of writing 'is equal to'!",
    "Cool: Algebra is used in video game development to create realistic graphics and physics!",
  ],
  "English I": [
    "Fun fact: The first English dictionary was published in 1604 and had only 2,543 words!",
    "Cool: Edgar Allan Poe invented the detective fiction genre with 'The Murders in the Rue Morgue'!",
    "Writing power: The average person sends over 40 emails a day -- good writing skills matter!",
  ],
  "English II": [
    "Did you know? The longest sentence in literature is in 'Les Miserables' at 823 words!",
    "Cool: Maya Angelou could speak six languages fluently!",
    "Writing power: Strong writing skills are the #1 skill employers look for in new hires!",
  ],
  Biology: [
    "Amazing: Your DNA stretched out would reach from the Sun to Pluto and back -- 17 times!",
    "Fun fact: Octopuses have three hearts and blue blood!",
    "Cool: A single human cell contains about 6 feet of DNA packed into a space 0.0002 inches wide!",
  ],
  "U.S. History": [
    "Did you know? The first text message was sent in 1992 -- it just said 'Merry Christmas'!",
    "Fun fact: Six U.S. presidents were born in Texas -- more than any other state except Virginia!",
    "Cool: The youngest person to graduate college was Michael Kearney at age 10 in 1994!",
  ],
};

const MOTIVATIONAL_QUOTES = [
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function StreakBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  useEffect(() => { document.title = "STAAR Test Prep | AI Mastery Academy"; }, []);
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-bold shadow-lg animate-bounce" data-testid="badge-streak">
      <Flame className="h-4 w-4" />
      {count} Streak!
    </div>
  );
}

function CelebrationOverlay({ score, onClose }: { score: number; onClose: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); onClose(); }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  const getMessage = () => {
    if (score >= 90) return { title: "INCREDIBLE!", subtitle: "You're a STAAR Master!", icon: Crown };
    if (score >= 80) return { title: "AMAZING!", subtitle: "Masters Grade Level!", icon: Trophy };
    if (score >= 70) return { title: "GREAT JOB!", subtitle: "You're meeting grade level!", icon: Medal };
    if (score >= 60) return { title: "NICE WORK!", subtitle: "Keep practicing to level up!", icon: Star };
    return { title: "KEEP GOING!", subtitle: "Every practice makes you stronger!", icon: Rocket };
  };

  const msg = getMessage();
  const Icon = msg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setVisible(false); onClose(); }} data-testid="overlay-celebration">
      <div className="text-center animate-in zoom-in-95 duration-300 p-8 rounded-2xl bg-white dark:bg-gray-900 shadow-2xl max-w-sm mx-4">
        <div className="relative">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Icon className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-black bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent mb-1">{msg.title}</h2>
        <p className="text-lg font-semibold text-foreground mb-1">{msg.subtitle}</p>
        <p className="text-4xl font-black text-primary">{score}%</p>
        <p className="text-xs text-muted-foreground mt-2">Tap anywhere to continue</p>
      </div>
    </div>
  );
}

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
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentFunFact, setCurrentFunFact] = useState("");
  const [currentQuote] = useState(() => getRandomItem(MOTIVATIONAL_QUOTES));

  const currentGradeInfo = STAAR_GRADES[selectedGradeIdx];
  const currentGrade = currentGradeInfo.grade;

  useEffect(() => {
    const facts = FUN_FACTS[selectedSubject] || FUN_FACTS["Math"];
    setCurrentFunFact(getRandomItem(facts));
  }, [selectedSubject, selectedGradeIdx]);

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
    setStreak(0);
  }

  function startAssessment() {
    setAssessmentMode(true);
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setAnswers([]);
    setShowResult(false);
    setAssessmentComplete(false);
    setAssessmentStartTime(Date.now());
    setStreak(0);
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
    if (isCorrect) {
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
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
      setShowCelebration(true);
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
      {showCelebration && (
        <CelebrationOverlay score={scorePercent} onClose={() => setShowCelebration(false)} />
      )}

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <PageHeader
          title="STAAR Test Prep"
          description="Grade-level study guides aligned to Texas Essential Knowledge and Skills (TEKS)"
          breadcrumbs={[{ label: "Academy", href: "/academy" }, { label: "STAAR Prep" }]}
        />
      </div>

      <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-rose-800 text-white py-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-10 text-6xl font-black">STAAR</div>
          <div className="absolute bottom-2 right-10 text-4xl font-black">TEXAS</div>
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
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
            <div className="rounded-xl p-3 bg-white/10 backdrop-blur">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" data-testid="text-hero-title">
                STAAR Test Prep
              </h1>
              <p className="text-rose-100 text-sm sm:text-base" data-testid="text-hero-subtitle">
                Your personal study buddy for Texas STAAR success -- from 3rd grade all the way through high school!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Badge variant="outline" className="border-white/30 text-white text-xs">
              <Star className="h-3 w-3 mr-1" /> Grades 3-11
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white text-xs">
              <Target className="h-3 w-3 mr-1" /> TEKS-Aligned
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white text-xs">
              <Brain className="h-3 w-3 mr-1" /> Personalized
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white text-xs">
              <Rocket className="h-3 w-3 mr-1" /> EOC Exams
            </Badge>
          </div>

          <Card className="mt-5 bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-3 flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-amber-300 shrink-0" />
              <p className="text-xs italic text-rose-100" data-testid="text-fun-fact">{currentFunFact}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Card data-testid="card-grade-selector" className="border-2 border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-primary" />
              Pick Your Grade & Subject
            </CardTitle>
            <p className="text-xs text-muted-foreground">Choose what you want to study today!</p>
          </CardHeader>
          <CardContent>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Elementary (3-5)</p>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {STAAR_GRADES.filter(g => g.band === "elementary").map((g, _idx) => {
                  const realIdx = STAAR_GRADES.indexOf(g);
                  return (
                    <Button
                      key={g.gradeKey || `${g.grade}-${g.subjects[0]}`}
                      variant={selectedGradeIdx === realIdx ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGradeChange(realIdx)}
                      data-testid={`button-grade-${g.gradeKey || g.grade}`}
                      className="text-xs"
                    >
                      {g.name}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Middle School (6-8)</p>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {STAAR_GRADES.filter(g => g.band === "middle").map((g) => {
                  const realIdx = STAAR_GRADES.indexOf(g);
                  return (
                    <Button
                      key={g.gradeKey || `${g.grade}-${g.subjects[0]}`}
                      variant={selectedGradeIdx === realIdx ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGradeChange(realIdx)}
                      data-testid={`button-grade-${g.gradeKey || g.grade}`}
                      className="text-xs"
                    >
                      {g.name}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">High School EOC Exams</p>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="flex flex-wrap gap-2">
                {STAAR_GRADES.filter(g => g.band === "highschool").map((g) => {
                  const realIdx = STAAR_GRADES.indexOf(g);
                  return (
                    <Button
                      key={g.gradeKey || `${g.grade}-${g.subjects[0]}`}
                      variant={selectedGradeIdx === realIdx ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGradeChange(realIdx)}
                      data-testid={`button-grade-${g.gradeKey || g.grade}`}
                      className="text-xs"
                    >
                      {g.name}
                    </Button>
                  );
                })}
              </div>
            </div>
            {currentGradeInfo.subjects.length > 1 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Subject</p>
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
            )}

            <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium">
                  Now studying: <span className="text-primary font-bold">{currentGradeInfo.name} - {selectedSubject}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {guides.length} study guides &middot; {questions.length > 0 ? `${questions.length} practice questions` : "Load practice tab for questions"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-indigo-100 dark:bg-indigo-900/50 shrink-0">
              <Heart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200 italic">"{currentQuote.text}"</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">-- {currentQuote.author}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setAssessmentMode(false); setAssessmentComplete(false); setStreak(0); }}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="study" data-testid="tab-study" className="text-xs sm:text-sm">
              <BookOpen className="h-4 w-4 mr-1" /> Study
            </TabsTrigger>
            <TabsTrigger value="practice" data-testid="tab-practice" className="text-xs sm:text-sm">
              <Zap className="h-4 w-4 mr-1" /> Practice
            </TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress" className="text-xs sm:text-sm">
              <Trophy className="h-4 w-4 mr-1" /> Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="study" className="mt-4 space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <Brain className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Pro Tip:</span> Read through each study guide, then tap the vocabulary words to help them stick! When you're ready, hit the Practice tab to test yourself.
              </p>
            </div>

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
                <p className="text-xs text-muted-foreground mt-1">Try selecting a different grade or subject!</p>
              </Card>
            ) : (
              <>
                {guides.map((guide: any, guideIdx: number) => (
                  <Card key={guide.id} className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`card-guide-${guide.tekCode}`}>
                    <div
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                      data-testid={`button-expand-${guide.tekCode}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{guideIdx + 1}</span>
                            <Badge variant="outline" className="text-xs font-mono">{guide.tekCode}</Badge>
                            <Badge className={`text-xs ${DIFFICULTY_COLORS[guide.difficultyLevel]}`}>
                              {guide.difficultyLevel === "easy" ? "Beginner" : guide.difficultyLevel === "medium" ? "Intermediate" : "Advanced"}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-sm mt-1">{guide.topicName}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{guide.tekDescription}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {expandedGuide === guide.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>
                    {expandedGuide === guide.id && (
                      <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-gradient-to-b from-muted/20 to-muted/5">
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> What You Need to Know
                          </h4>
                          <p className="text-sm leading-relaxed">{guide.content}</p>
                        </div>
                        {guide.keyVocabulary && guide.keyVocabulary.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Words to Know
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {guide.keyVocabulary.map((word: string) => (
                                <Badge key={word} variant="secondary" className="text-xs hover:bg-primary/20 hover:text-primary transition-colors cursor-default">{word}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {guide.studyTips && guide.studyTips.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" /> Study Hacks
                            </h4>
                            <ul className="space-y-1.5">
                              {guide.studyTips.map((tip: string, i: number) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <Zap className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={(e) => { e.stopPropagation(); setActiveTab("practice"); }}
                            data-testid={`button-practice-${guide.tekCode}`}
                          >
                            <Zap className="h-3 w-3 mr-1" /> Practice This Topic
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
                <div className="text-center pt-2">
                  <Button onClick={() => setActiveTab("practice")} data-testid="button-ready-to-practice">
                    <Rocket className="h-4 w-4 mr-2" /> Ready to Practice? Let's Go!
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="practice" className="mt-4">
            {!assessmentMode && !assessmentComplete && (
              <Card className="p-6 text-center border-2 border-dashed border-primary/20" data-testid="card-start-assessment">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-1">Ready to Test Your Knowledge?</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {currentGradeInfo.name} - {selectedSubject}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {questionsLoading ? "Loading your questions..." : `${questions.length} questions waiting for you!`}
                </p>
                <div className="flex items-center justify-center gap-3 mb-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Instant feedback</span>
                  <span className="flex items-center gap-1"><Brain className="h-3 w-3 text-blue-500" /> Learn as you go</span>
                  <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> Build streaks</span>
                </div>
                <Button onClick={startAssessment} disabled={questionsLoading || questions.length === 0} size="lg" className="font-semibold" data-testid="button-start-assessment">
                  <Zap className="h-5 w-5 mr-2" /> Start Practice Test
                </Button>
              </Card>
            )}

            {assessmentMode && !assessmentComplete && questions[currentQuestion] && (
              <Card data-testid="card-question" className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-muted/50 to-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-semibold">
                        Question {currentQuestion + 1} of {questions.length}
                      </Badge>
                      <StreakBadge count={streak} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {questions[currentQuestion].tekCode}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span>{correctCount}</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mt-2 h-2" />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <p className="text-sm font-medium leading-relaxed" data-testid="text-question">
                    {questions[currentQuestion].questionText}
                  </p>
                  <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} disabled={showResult} data-testid="group-answer-options">
                    {(questions[currentQuestion].options as string[]).map((opt: string, i: number) => {
                      const letters = ["A", "B", "C", "D"];
                      return (
                        <div
                          key={i}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                            showResult
                              ? opt === questions[currentQuestion].correctAnswer
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm"
                                : opt === selectedAnswer && opt !== questions[currentQuestion].correctAnswer
                                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                  : "border-border opacity-50"
                              : selectedAnswer === opt
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
                          }`}
                          data-testid={`option-${i}`}
                        >
                          <RadioGroupItem value={opt} id={`opt-${i}`} />
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{letters[i]}</span>
                          <Label htmlFor={`opt-${i}`} className="text-sm cursor-pointer flex-1">{opt}</Label>
                          {showResult && opt === questions[currentQuestion].correctAnswer && (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          )}
                          {showResult && opt === selectedAnswer && opt !== questions[currentQuestion].correctAnswer && (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {showResult && (
                    <Card className={`p-4 ${answers[answers.length - 1]?.correct ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200"}`}>
                      <div className="flex items-start gap-3">
                        {answers[answers.length - 1]?.correct ? (
                          <div className="rounded-full p-1.5 bg-emerald-100 dark:bg-emerald-800 shrink-0">
                            <ThumbsUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        ) : (
                          <div className="rounded-full p-1.5 bg-amber-100 dark:bg-amber-800 shrink-0">
                            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold mb-0.5">
                            {answers[answers.length - 1]?.correct
                              ? getRandomItem(ENCOURAGEMENT_CORRECT)
                              : getRandomItem(ENCOURAGEMENT_INCORRECT)}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{questions[currentQuestion].explanation}</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="flex justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setAssessmentMode(false); setAssessmentComplete(false); }}
                      data-testid="button-quit-assessment"
                      className="text-muted-foreground"
                    >
                      Exit
                    </Button>
                    {!showResult ? (
                      <Button size="sm" onClick={handleSubmitAnswer} disabled={!selectedAnswer} data-testid="button-submit-answer" className="font-semibold">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Check Answer
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleNextQuestion} data-testid="button-next-question" className="font-semibold">
                        {currentQuestion + 1 >= questions.length ? (
                          <><Trophy className="h-4 w-4 mr-1" /> See My Results</>
                        ) : (
                          <><Zap className="h-4 w-4 mr-1" /> Next Question</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {assessmentComplete && (
              <Card data-testid="card-assessment-results" className="overflow-hidden">
                <div className={`p-6 text-center ${scorePercent >= 80 ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30" : scorePercent >= 60 ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30" : "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30"}`}>
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${scorePercent >= 80 ? "bg-emerald-100 dark:bg-emerald-900/50" : scorePercent >= 60 ? "bg-amber-100 dark:bg-amber-900/50" : "bg-rose-100 dark:bg-rose-900/50"}`}>
                    {scorePercent >= 80 ? <Crown className="h-10 w-10 text-emerald-600" /> : scorePercent >= 60 ? <Medal className="h-10 w-10 text-amber-600" /> : <Rocket className="h-10 w-10 text-rose-600" />}
                  </div>
                  <div className={`text-5xl font-black mb-1 ${scorePercent >= 80 ? "text-emerald-600" : scorePercent >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                    {scorePercent}%
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {correctCount} of {answers.length} correct
                  </p>
                  <Badge className={`mt-1 text-sm px-3 py-1 ${scorePercent >= 80 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : scorePercent >= 60 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300" : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"}`}>
                    {scorePercent >= 80 ? "Masters Grade Level" : scorePercent >= 60 ? "Meets Grade Level" : scorePercent >= 40 ? "Approaches Grade Level" : "Keep Practicing!"}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-3 max-w-sm mx-auto">
                    {scorePercent >= 80
                      ? "Outstanding! You really know this material. Keep it up and you'll ace the STAAR!"
                      : scorePercent >= 60
                        ? "Great work! You're on the right track. A little more practice and you'll be at Masters level!"
                        : "Every question you practice makes you smarter. Review the study guides and try again -- you've got this!"}
                  </p>
                </div>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.from(new Set(answers.filter(a => a.correct).map(a => a.topicName))).length > 0 && (
                      <Card className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200">
                        <h4 className="text-xs font-bold flex items-center gap-1 mb-1 text-emerald-700 dark:text-emerald-400">
                          <Star className="h-3 w-3" /> Your Strengths
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(answers.filter(a => a.correct).map(a => a.topicName))).map(t => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </Card>
                    )}
                    {Array.from(new Set(answers.filter(a => !a.correct).map(a => a.topicName))).length > 0 && (
                      <Card className="p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                        <h4 className="text-xs font-bold flex items-center gap-1 mb-1 text-amber-700 dark:text-amber-400">
                          <Target className="h-3 w-3" /> Keep Practicing
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(answers.filter(a => !a.correct).map(a => a.topicName))).map(t => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button onClick={startAssessment} data-testid="button-retake" className="font-semibold">
                      <Zap className="h-4 w-4 mr-2" /> Try Again
                    </Button>
                    <Button variant="outline" onClick={() => { setActiveTab("study"); setAssessmentComplete(false); setAssessmentMode(false); }} data-testid="button-review-guides">
                      <BookOpen className="h-4 w-4 mr-2" /> Review Study Guides
                    </Button>
                    <Button variant="outline" onClick={() => { setAssessmentComplete(false); setAssessmentMode(false); }} data-testid="button-back-to-start">
                      Back
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
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Topic Mastery - {currentGradeInfo.name} {selectedSubject}
                </CardTitle>
                <p className="text-xs text-muted-foreground">Track how well you know each topic. Keep practicing to level up!</p>
              </CardHeader>
              <CardContent>
                {mastery.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold mb-1">No Progress Yet</h4>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Take a practice test to start tracking your progress! Every question you answer helps us understand what you know.</p>
                    <Button size="sm" className="mt-4" onClick={() => setActiveTab("practice")} data-testid="button-start-practice">
                      <Rocket className="h-4 w-4 mr-2" /> Start Practicing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mastery.map((m: any) => {
                      const masteryInfo = MASTERY_COLORS[m.masteryLevel] || MASTERY_COLORS.not_started;
                      const pct = m.totalAttempts > 0 ? Math.round((m.correctAttempts / m.totalAttempts) * 100) : 0;
                      return (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-testid={`mastery-${m.tekCode}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">{m.tekCode}</span>
                              <span className="text-sm font-medium truncate">{m.topicName}</span>
                            </div>
                            <Progress value={pct} className="mt-1.5 h-2" />
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
                  <Clock className="h-5 w-5 text-primary" />
                  Your Test History
                </CardTitle>
                <p className="text-xs text-muted-foreground">See how you've improved over time!</p>
              </CardHeader>
              <CardContent>
                {assessmentHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No tests completed yet. Your scores will show up here!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assessmentHistory.map((a: any, idx: number) => {
                      const date = new Date(a.completedAt);
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-testid={`history-${a.id}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${a.scorePercent >= 80 ? "bg-emerald-100 text-emerald-700" : a.scorePercent >= 60 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                              {idx === 0 ? "NEW" : `#${assessmentHistory.length - idx}`}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {a.subject} - {currentGradeInfo.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {a.timeSpentSeconds && ` · ${Math.floor(a.timeSpentSeconds / 60)}m ${a.timeSpentSeconds % 60}s`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-black ${a.scorePercent >= 80 ? "text-emerald-600" : a.scorePercent >= 60 ? "text-amber-600" : "text-rose-600"}`}>
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
              <Card className="border-2 border-amber-200 dark:border-amber-800" data-testid="card-recommendations">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Lightbulb className="h-5 w-5" />
                    Your Personal Study Plan
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">We noticed some topics that could use extra practice. Here's your personalized study plan!</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mastery.filter((m: any) => m.masteryLevel === "needs_practice" || m.masteryLevel === "developing").map((m: any) => (
                      <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                        <div className="rounded-full p-1.5 bg-amber-100 dark:bg-amber-800 shrink-0 mt-0.5">
                          {m.masteryLevel === "needs_practice" ? <Target className="h-3.5 w-3.5 text-amber-600" /> : <TrendingUp className="h-3.5 w-3.5 text-amber-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{m.topicName} ({m.tekCode})</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {m.masteryLevel === "needs_practice"
                              ? `You got ${Math.round((m.correctAttempts / m.totalAttempts) * 100)}% right so far. Let's review the study guide and try some more practice problems -- you'll get it!`
                              : `You're at ${Math.round((m.correctAttempts / m.totalAttempts) * 100)}%! Almost there! Just a few more practice sessions and this topic will click!`}
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
