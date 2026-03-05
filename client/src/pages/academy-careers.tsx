import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Briefcase,
  GraduationCap,
  Wrench,
  Shield,
  Rocket,
  Search,
  Star,
  BookmarkPlus,
  Bookmark,
  Award,
  ChevronRight,
  Clipboard,
  Target,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Leaf,
  Palette,
  DollarSign,
  BookOpen,
  Cog,
  Heart,
  Scale,
  Megaphone,
  FlaskConical,
  Hammer,
  Monitor,
  TrendingUp,
  Users,
  Building2,
  Handshake,
} from "lucide-react";

interface CareerField {
  id: string;
  name: string;
  category: string;
  description: string;
  educationPath: string;
  salaryRange: string | null;
  requiredSkills: string[] | null;
  relatedSubjects: string[] | null;
  gradeLevel: string | null;
  iconName: string | null;
  sortOrder: number | null;
}

interface CareerMilestone {
  id: string;
  gradeLevel: number;
  title: string;
  description: string;
  category: string;
  awardName: string | null;
  awardDescription: string | null;
  requirements: string | null;
  sortOrder: number | null;
}

const CAREER_CATEGORIES = [
  "Agriculture & Environment",
  "Arts & Creative",
  "Business & Finance",
  "Education",
  "Engineering",
  "Healthcare",
  "Law & Justice",
  "Media & Communications",
  "Military & Public Service",
  "Science & Research",
  "Skilled Trades",
  "Technology",
];

const CATEGORIES = ["All", ...CAREER_CATEGORIES];

function getCategoryIcon(category: string) {
  switch (category) {
    case "Agriculture & Environment": return Leaf;
    case "Arts & Creative": return Palette;
    case "Business & Finance": return DollarSign;
    case "Education": return BookOpen;
    case "Engineering": return Cog;
    case "Healthcare": return Heart;
    case "Law & Justice": return Scale;
    case "Media & Communications": return Megaphone;
    case "Military & Public Service": return Shield;
    case "Science & Research": return FlaskConical;
    case "Skilled Trades": return Hammer;
    case "Technology": return Monitor;
    case "College": return GraduationCap;
    case "Trade/Tech": return Wrench;
    case "Military": return Shield;
    case "Entrepreneurship": return Rocket;
    default: return Briefcase;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Agriculture & Environment": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "Arts & Creative": return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
    case "Business & Finance": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "Education": return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
    case "Engineering": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "Healthcare": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    case "Law & Justice": return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300";
    case "Media & Communications": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    case "Military & Public Service": return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
    case "Science & Research": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
    case "Skilled Trades": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "Technology": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "College": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "Trade/Tech": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "Military": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "Entrepreneurship": return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
    default: return "";
  }
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Agriculture & Environment": "Build job-ready skills in farming, conservation, and sustainability. A growing pipeline to careers in environmental science, agribusiness, and green energy.",
  "Arts & Creative": "Develop workforce-ready talents in visual arts, music, design, and digital media. Industry partnerships connect youth to creative economy careers.",
  "Business & Finance": "Gain job readiness in financial literacy, management, and entrepreneurship. School-to-career pathways into banking, consulting, and business leadership.",
  "Education": "Shape future generations through teaching, mentoring, and program development. Career advancement pathways from classroom aide to school leadership.",
  "Engineering": "Master in-demand STEM skills through hands-on training. Industry-aligned pathways to high-growth engineering careers with strong earning potential.",
  "Healthcare": "Develop critical workforce skills in patient care, medical technology, and public health. High-demand career pipeline with clear advancement opportunities.",
  "Law & Justice": "Build career-ready skills in legal analysis, public policy, and community advocacy. Pathways to careers protecting rights and serving communities.",
  "Media & Communications": "Train in digital storytelling, journalism, and content creation. Industry partnerships open doors to careers in media, marketing, and public relations.",
  "Military & Public Service": "Develop leadership and service skills through structured career pathways. Opportunities in defense, government, emergency services, and community development.",
  "Science & Research": "Build research and analytical skills aligned with industry needs. School-to-career pipeline into laboratories, universities, and innovation-driven companies.",
  "Skilled Trades": "Gain certifications and hands-on training in electrical, plumbing, welding, and construction. High-demand career pathways with strong job placement rates.",
  "Technology": "Master coding, cybersecurity, AI, and data science skills. Industry-partnered school-to-career pipeline into the fastest-growing job market.",
};

interface AssessmentQuestion {
  id: number;
  question: string;
  options: { text: string; categories: string[] }[];
}

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    question: "What sounds like the most fun Saturday activity?",
    options: [
      { text: "Hiking in nature and exploring trails", categories: ["Agriculture & Environment", "Science & Research"] },
      { text: "Building a robot or coding a game", categories: ["Technology", "Engineering"] },
      { text: "Volunteering at a community center", categories: ["Education", "Healthcare"] },
      { text: "Making a short film or painting", categories: ["Arts & Creative", "Media & Communications"] },
    ],
  },
  {
    id: 2,
    question: "Which school subject do you enjoy most?",
    options: [
      { text: "Math and Physics", categories: ["Engineering", "Technology"] },
      { text: "Biology and Chemistry", categories: ["Healthcare", "Science & Research"] },
      { text: "English and Social Studies", categories: ["Law & Justice", "Education"] },
      { text: "Art, Music, or Drama", categories: ["Arts & Creative", "Media & Communications"] },
    ],
  },
  {
    id: 3,
    question: "If you could solve one world problem, which would it be?",
    options: [
      { text: "Climate change and pollution", categories: ["Agriculture & Environment", "Science & Research"] },
      { text: "Poverty and inequality", categories: ["Business & Finance", "Law & Justice"] },
      { text: "Disease and health crises", categories: ["Healthcare"] },
      { text: "Lack of access to education", categories: ["Education", "Military & Public Service"] },
    ],
  },
  {
    id: 4,
    question: "What best describes how you like to work?",
    options: [
      { text: "Independently, focused on my own projects", categories: ["Technology", "Arts & Creative"] },
      { text: "On a team, collaborating with others", categories: ["Healthcare", "Media & Communications"] },
      { text: "Leading a group toward a goal", categories: ["Business & Finance", "Military & Public Service"] },
      { text: "Teaching and helping others learn", categories: ["Education"] },
    ],
  },
  {
    id: 5,
    question: "Which sounds most interesting to you?",
    options: [
      { text: "Building and fixing things with your hands", categories: ["Skilled Trades", "Engineering"] },
      { text: "Helping people feel better or safer", categories: ["Healthcare", "Law & Justice"] },
      { text: "Creating art, music, or designs", categories: ["Arts & Creative"] },
      { text: "Discovering how the world works", categories: ["Science & Research", "Agriculture & Environment"] },
    ],
  },
  {
    id: 6,
    question: "Where would you most like to work?",
    options: [
      { text: "Outdoors, close to nature", categories: ["Agriculture & Environment", "Skilled Trades"] },
      { text: "In an office or boardroom", categories: ["Business & Finance", "Law & Justice"] },
      { text: "In a lab or research facility", categories: ["Science & Research", "Healthcare"] },
      { text: "On a stage, set, or studio", categories: ["Arts & Creative", "Media & Communications"] },
    ],
  },
  {
    id: 7,
    question: "What are you most curious about?",
    options: [
      { text: "How machines and technology work", categories: ["Engineering", "Technology"] },
      { text: "How people think and feel", categories: ["Healthcare", "Education"] },
      { text: "How money and businesses operate", categories: ["Business & Finance"] },
      { text: "How to create something new and original", categories: ["Arts & Creative", "Media & Communications"] },
    ],
  },
  {
    id: 8,
    question: "Which superpower would you choose?",
    options: [
      { text: "Super intelligence to invent anything", categories: ["Technology", "Engineering"] },
      { text: "Healing powers to cure any illness", categories: ["Healthcare", "Science & Research"] },
      { text: "The ability to communicate with animals and nature", categories: ["Agriculture & Environment"] },
      { text: "Mind reading to understand everyone", categories: ["Law & Justice", "Military & Public Service"] },
    ],
  },
  {
    id: 9,
    question: "Your friend needs help with a big problem. What do you do?",
    options: [
      { text: "Listen carefully and offer emotional support", categories: ["Healthcare", "Education"] },
      { text: "Take charge and organize a plan", categories: ["Military & Public Service", "Business & Finance"] },
      { text: "Research the problem and find data to help", categories: ["Science & Research", "Technology"] },
      { text: "Get creative and think outside the box", categories: ["Arts & Creative", "Media & Communications"] },
    ],
  },
  {
    id: 10,
    question: "What would you build if you had unlimited resources?",
    options: [
      { text: "A futuristic city with amazing architecture", categories: ["Engineering", "Skilled Trades"] },
      { text: "A global company that changes the world", categories: ["Business & Finance"] },
      { text: "A massive art installation or music festival", categories: ["Arts & Creative", "Media & Communications"] },
      { text: "A state-of-the-art hospital or school", categories: ["Healthcare", "Education"] },
    ],
  },
  {
    id: 11,
    question: "Pick the tool you'd most want to master:",
    options: [
      { text: "A high-powered computer or coding setup", categories: ["Technology", "Science & Research"] },
      { text: "A set of professional power tools", categories: ["Skilled Trades", "Engineering"] },
      { text: "A camera, microphone, or musical instrument", categories: ["Media & Communications", "Arts & Creative"] },
      { text: "A stethoscope or microscope", categories: ["Healthcare", "Science & Research"] },
    ],
  },
  {
    id: 12,
    question: "What kind of stories interest you most?",
    options: [
      { text: "True crime, legal dramas, or mystery", categories: ["Law & Justice", "Military & Public Service"] },
      { text: "Science fiction and futuristic adventures", categories: ["Technology", "Engineering"] },
      { text: "Real-life stories about overcoming challenges", categories: ["Education", "Healthcare"] },
      { text: "Nature documentaries and environmental stories", categories: ["Agriculture & Environment", "Science & Research"] },
    ],
  },
];

type AssessmentState = "not_started" | "in_progress" | "completed";

function CareerAssessment({
  careers,
  onExploreCategory,
}: {
  careers: CareerField[];
  onExploreCategory: (category: string) => void;
}) {
  const [assessmentState, setAssessmentState] = useState<AssessmentState>("not_started");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [results, setResults] = useState<{ category: string; score: number }[]>([]);

  const handleStart = () => {
    setAssessmentState("in_progress");
    setCurrentQuestion(0);
    setAnswers([]);
    setResults([]);
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const scores: Record<string, number> = {};
      CAREER_CATEGORIES.forEach((cat) => (scores[cat] = 0));

      newAnswers.forEach((ansIdx, qIdx) => {
        const question = ASSESSMENT_QUESTIONS[qIdx];
        const selectedOption = question.options[ansIdx];
        if (selectedOption) {
          selectedOption.categories.forEach((cat) => {
            scores[cat] = (scores[cat] || 0) + 1;
          });
        }
      });

      const sorted = Object.entries(scores)
        .map(([category, score]) => ({ category, score }))
        .sort((a, b) => b.score - a.score);

      setResults(sorted.slice(0, 3));
      setAssessmentState("completed");
    }
  };

  const handleRetake = () => {
    handleStart();
  };

  if (assessmentState === "not_started") {
    return (
      <Card className="p-5 sm:p-6 mb-8 border-rose-200 dark:border-rose-800/50" data-testid="card-assessment-start">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="rounded-md p-3 bg-gradient-to-br from-rose-500 to-red-600 shrink-0">
            <Clipboard className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg mb-1" data-testid="text-assessment-title">
              Career Readiness Assessment
            </h2>
            <p className="text-sm text-muted-foreground">
              Answer 12 quick questions to discover your school-to-career pathway. Identify workforce-ready skills and career fields that match your strengths. Takes about 3 minutes!
            </p>
          </div>
          <Button
            onClick={handleStart}
            className="bg-gradient-to-r from-rose-600 to-red-600 text-white border-none shrink-0"
            data-testid="button-start-assessment"
          >
            <Target className="h-4 w-4 mr-2" />
            Start Career Readiness Assessment
          </Button>
        </div>
      </Card>
    );
  }

  if (assessmentState === "in_progress") {
    const question = ASSESSMENT_QUESTIONS[currentQuestion];
    const progressValue = ((currentQuestion) / ASSESSMENT_QUESTIONS.length) * 100;

    return (
      <Card className="p-5 sm:p-6 mb-8 border-rose-200 dark:border-rose-800/50" data-testid="card-assessment-quiz">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="rounded-md p-2 bg-gradient-to-br from-rose-500 to-red-600 shrink-0">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" data-testid="text-question-progress">
              Question {currentQuestion + 1} of {ASSESSMENT_QUESTIONS.length}
            </p>
            <Progress value={progressValue} className="h-2 mt-1" data-testid="progress-assessment" />
          </div>
        </div>

        <h3 className="font-semibold text-base sm:text-lg mb-4" data-testid="text-question">
          {question.question}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="section-answer-options">
          {question.options.map((option, idx) => (
            <Card
              key={idx}
              className="p-4 cursor-pointer hover-elevate transition-all"
              onClick={() => handleAnswer(idx)}
              data-testid={`button-answer-${idx}`}
            >
              <p className="text-sm font-medium">{option.text}</p>
            </Card>
          ))}
        </div>
      </Card>
    );
  }

  const topMatch = results[0];

  return (
    <Card className="p-5 sm:p-6 mb-8 border-rose-200 dark:border-rose-800/50" data-testid="card-assessment-results">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="rounded-md p-2 bg-gradient-to-br from-rose-500 to-red-600 shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h2 className="font-semibold text-lg" data-testid="text-results-title">
          Your School-to-Career Pathway Results
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {results.map((result, idx) => {
          const IconComp = getCategoryIcon(result.category);
          const colorClass = getCategoryColor(result.category);
          const matchingCareers = careers
            .filter((c) => c.category === result.category)
            .slice(0, 3);

          return (
            <Card
              key={result.category}
              className={`p-4 ${idx === 0 ? "ring-2 ring-rose-400 dark:ring-rose-600" : ""}`}
              data-testid={`card-result-${idx}`}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  #{idx + 1} Match
                </Badge>
                <Badge variant="secondary" className={colorClass}>
                  <IconComp className="h-3 w-3 mr-1" />
                  {result.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {CATEGORY_DESCRIPTIONS[result.category] || ""}
              </p>
              {matchingCareers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Top career pathways:</p>
                  {matchingCareers.map((career) => (
                    <div key={career.id} className="flex items-center gap-1.5" data-testid={`text-result-career-${career.id}`}>
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs">{career.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={handleRetake}
          data-testid="button-retake-assessment"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retake Assessment
        </Button>
        {topMatch && (
          <Button
            onClick={() => onExploreCategory(topMatch.category)}
            className="bg-gradient-to-r from-rose-600 to-red-600 text-white border-none"
            data-testid="button-explore-top-match"
          >
            Explore Your Top Match
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-36 w-full rounded-md" />
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}

export default function AcademyCareersPage() {
  useEffect(() => {
    document.title = "School-to-Career Pipeline | AI Mastery Academy";
  }, []);

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerField | null>(null);

  const { data: careers, isLoading: careersLoading, isError: careersError, error: careersErrorObj } = useQuery<CareerField[]>({
    queryKey: ["/api/careers"],
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery<CareerMilestone[]>({
    queryKey: ["/api/career-milestones"],
  });

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  if (careersLoading) {
    return <LoadingSkeleton />;
  }

  if (careersError) {
    return (
      <div className="p-6 max-w-6xl mx-auto" data-testid="careers-error-state">
        <Card className="p-8 text-center">
          <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <h2 className="text-lg font-semibold mb-2" data-testid="text-error-title">Unable to Load Careers</h2>
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-error-message">
            {careersErrorObj instanceof Error ? careersErrorObj.message : "Something went wrong while loading career data. Please try again."}
          </p>
          <Button onClick={() => window.location.reload()} data-testid="button-retry-careers">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const allCareers = careers ?? [];
  const allMilestones = milestones ?? [];

  const filteredCareers = allCareers.filter((c) => {
    const matchesCategory =
      activeCategory === "All" ||
      c.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const bookmarkedCareers = allCareers.filter((c) => bookmarked.includes(c.id));

  const handleExploreCategory = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    const filtersEl = document.getElementById("category-filters");
    if (filtersEl) {
      filtersEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto" data-testid="academy-careers-page">
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-700 p-4 sm:p-6 lg:p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="rounded-md p-2.5 bg-white/10">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-careers-title">
            School-to-Career Pipeline
          </h1>
        </div>
        <p className="text-rose-100 text-base sm:text-lg mb-2" data-testid="text-careers-subtitle">
          Your Workforce Development Pathway Starts Here
        </p>
        <p className="text-rose-200 text-sm max-w-2xl" data-testid="text-careers-description">
          Explore industry-aligned career pathways designed to build job readiness, skill training, and career advancement for youth ages 14-24. Our school-to-career pipeline connects you with real workforce opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="section-pipeline-stats">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md p-2 bg-rose-100 dark:bg-rose-900/30 shrink-0">
              <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Career Pathways</p>
              <p className="font-semibold text-lg" data-testid="text-stat-pathways">12 Industries</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md p-2 bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Job Readiness</p>
              <p className="font-semibold text-lg" data-testid="text-stat-readiness">Skills-First</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md p-2 bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Industry Partners</p>
              <p className="font-semibold text-lg" data-testid="text-stat-partners">Connected</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md p-2 bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <Handshake className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mentorship</p>
              <p className="font-semibold text-lg" data-testid="text-stat-mentorship">1-on-1</p>
            </div>
          </div>
        </Card>
      </div>

      <CareerAssessment
        careers={allCareers}
        onExploreCategory={handleExploreCategory}
      />

      <div id="category-filters" className="flex items-center gap-2 mb-4 flex-wrap" data-testid="section-category-filters">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={activeCategory === cat ? "default" : "outline"}
            onClick={() => setActiveCategory(cat)}
            data-testid={`button-filter-${cat.toLowerCase().replace(/[&\s/]+/g, "-")}`}
            className="toggle-elevate"
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="relative mb-6 w-full sm:max-w-sm" data-testid="section-search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search careers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-careers"
        />
      </div>

      {filteredCareers.length > 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          data-testid="section-career-grid"
        >
          {filteredCareers.map((career) => {
            const IconComp = getCategoryIcon(career.category);
            const isBookmarked = bookmarked.includes(career.id);
            return (
              <Card
                key={career.id}
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => setSelectedCareer(career)}
                data-testid={`card-career-${career.id}`}
              >
                <div className="flex items-start justify-between gap-1 mb-3">
                  <div className="rounded-md p-2 bg-rose-100 dark:bg-rose-900/30 shrink-0">
                    <IconComp className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(career.id);
                    }}
                    data-testid={`button-bookmark-${career.id}`}
                  >
                    {isBookmarked ? (
                      <Bookmark className="h-4 w-4 text-amber-500" />
                    ) : (
                      <BookmarkPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <h3
                  className="font-semibold text-sm mb-1"
                  data-testid={`text-career-name-${career.id}`}
                >
                  {career.name}
                </h3>
                <Badge
                  variant="secondary"
                  className={`mb-2 ${getCategoryColor(career.category)}`}
                  data-testid={`badge-category-${career.id}`}
                >
                  {career.category}
                </Badge>
                <p
                  className="text-xs text-muted-foreground line-clamp-3 mb-3"
                  data-testid={`text-career-desc-${career.id}`}
                >
                  {career.description}
                </p>
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate" data-testid={`text-education-${career.id}`}>
                      {career.educationPath}
                    </span>
                  </div>
                  {career.salaryRange && (
                    <p className="text-xs text-muted-foreground" data-testid={`text-salary-${career.id}`}>
                      {career.salaryRange}
                    </p>
                  )}
                </div>
                {career.requiredSkills && career.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1" data-testid={`section-skills-${career.id}`}>
                    {career.requiredSkills.slice(0, 3).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="text-[10px] px-1.5"
                        data-testid={`badge-skill-${career.id}-${skill}`}
                      >
                        {skill}
                      </Badge>
                    ))}
                    {career.requiredSkills.length > 3 && (
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        +{career.requiredSkills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center mb-8" data-testid="card-no-careers">
          <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No careers found matching your criteria.</p>
        </Card>
      )}

      {bookmarkedCareers.length > 0 && (
        <div className="mb-8" data-testid="section-my-interests">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" /> My Career Pathway Interests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bookmarkedCareers.map((career) => {
              const IconComp = getCategoryIcon(career.category);
              return (
                <Card
                  key={career.id}
                  className="p-4 hover-elevate cursor-pointer"
                  onClick={() => setSelectedCareer(career)}
                  data-testid={`card-bookmarked-${career.id}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30 shrink-0">
                      <IconComp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-sm truncate" data-testid={`text-bookmarked-name-${career.id}`}>
                      {career.name}
                    </h3>
                  </div>
                  <Badge
                    variant="secondary"
                    className={getCategoryColor(career.category)}
                    data-testid={`badge-bookmarked-category-${career.id}`}
                  >
                    {career.category}
                  </Badge>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card className="p-5 sm:p-6 mb-8" data-testid="section-industry-partnerships">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="rounded-md p-2 bg-gradient-to-br from-emerald-500 to-teal-600 shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg" data-testid="text-partnerships-title">Industry Partnership Pipeline</h2>
            <p className="text-sm text-muted-foreground">Connecting youth to real workforce opportunities through employer partnerships</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium" data-testid="text-partnership-mentorship">Professional Mentorship</p>
              <p className="text-xs text-muted-foreground">Industry professionals guide youth through career readiness and skill development</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium" data-testid="text-partnership-placement">Job Placement Support</p>
              <p className="text-xs text-muted-foreground">Direct pathways to internships, apprenticeships, and entry-level positions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium" data-testid="text-partnership-advancement">Career Advancement</p>
              <p className="text-xs text-muted-foreground">Ongoing skill training and professional development for long-term career growth</p>
            </div>
          </div>
        </div>
      </Card>

      <div data-testid="section-milestones">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-muted-foreground" /> Workforce Readiness Milestones
        </h2>
        {milestonesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : allMilestones.length > 0 ? (
          <div className="space-y-3">
            {allMilestones.map((milestone) => (
              <Card key={milestone.id} className="p-4" data-testid={`card-milestone-${milestone.id}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-md p-2 bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                    <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm" data-testid={`text-milestone-title-${milestone.id}`}>
                        {milestone.title}
                      </h3>
                      <Badge variant="secondary" data-testid={`badge-milestone-grade-${milestone.id}`}>
                        Grade {milestone.gradeLevel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2" data-testid={`text-milestone-desc-${milestone.id}`}>
                      {milestone.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]" data-testid={`badge-milestone-category-${milestone.id}`}>
                        {milestone.category}
                      </Badge>
                      {milestone.awardName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" />
                          {milestone.awardName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center" data-testid="card-no-milestones">
            <Award className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No milestones available yet.</p>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedCareer} onOpenChange={() => setSelectedCareer(null)}>
        <DialogContent data-testid="dialog-career-details">
          {selectedCareer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2" data-testid="text-dialog-career-name">
                  {(() => {
                    const IconComp = getCategoryIcon(selectedCareer.category);
                    return <IconComp className="h-5 w-5" />;
                  })()}
                  {selectedCareer.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Badge
                  variant="secondary"
                  className={getCategoryColor(selectedCareer.category)}
                  data-testid="badge-dialog-category"
                >
                  {selectedCareer.category}
                </Badge>
                <p className="text-sm text-muted-foreground" data-testid="text-dialog-description">
                  {selectedCareer.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm" data-testid="text-dialog-education">
                      {selectedCareer.educationPath}
                    </span>
                  </div>
                  {selectedCareer.salaryRange && (
                    <p className="text-sm" data-testid="text-dialog-salary">
                      Salary: {selectedCareer.salaryRange}
                    </p>
                  )}
                  {selectedCareer.gradeLevel && (
                    <p className="text-sm text-muted-foreground" data-testid="text-dialog-grade">
                      Grade Level: {selectedCareer.gradeLevel}
                    </p>
                  )}
                </div>
                {selectedCareer.requiredSkills && selectedCareer.requiredSkills.length > 0 && (
                  <div data-testid="section-dialog-skills">
                    <p className="text-sm font-medium mb-2">Workforce-Ready Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedCareer.requiredSkills.map((skill) => (
                        <Badge key={skill} variant="outline" data-testid={`badge-dialog-skill-${skill}`}>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCareer.relatedSubjects && selectedCareer.relatedSubjects.length > 0 && (
                  <div data-testid="section-dialog-subjects">
                    <p className="text-sm font-medium mb-2">Related Subjects</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedCareer.relatedSubjects.map((subj) => (
                        <Badge key={subj} variant="secondary" data-testid={`badge-dialog-subject-${subj}`}>
                          {subj}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toggleBookmark(selectedCareer.id);
                    }}
                    data-testid="button-dialog-bookmark"
                  >
                    {bookmarked.includes(selectedCareer.id) ? (
                      <>
                        <Bookmark className="h-4 w-4 mr-1 text-amber-500" />
                        Bookmarked
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-4 w-4 mr-1" />
                        Add to Interests
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCareer(null)}
                    data-testid="button-dialog-close"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
