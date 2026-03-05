import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Home, Building2, Wand2, Users, Activity, AlertTriangle,
  ClipboardCheck, Briefcase, Route, UserPlus, MapPin, Wallet,
  Zap, Shield, CheckCircle, ChevronLeft, ChevronRight, Lightbulb, Gamepad2, DollarSign,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SlideData {
  title: string;
  icon: LucideIcon;
  overview: string;
  keyPoints: string[];
  tip: string;
  isChecklist?: boolean;
}

const slides: SlideData[] = [
  {
    title: "Welcome to AI Mastery Academy Admin Center",
    icon: Home,
    overview: "You manage 60 sixth graders' entire learning journey from this platform. Every tool you need is right here.",
    keyPoints: [
      "All features accessible from sidebar",
      "Role-based access for admins, teachers, and parents",
      "Data-driven decisions at every level",
    ],
    tip: "Start by exploring the Admin Dashboard for a quick overview",
  },
  {
    title: "Panther Village Campus",
    icon: Building2,
    overview: "The virtual campus with 17+ buildings, each linking to a feature. Students explore and learn through an interactive village experience.",
    keyPoints: [
      "Students navigate via building cards",
      "Activity feed shows real-time engagement",
      "Quick stats show campus health",
    ],
    tip: "Check the campus daily to see which buildings are most active",
  },
  {
    title: "Student Management & Wizards",
    icon: Wand2,
    overview: "Three wizard types to personalize each child's experience. Wizards guide you through setup, career planning, and quarterly reviews.",
    keyPoints: [
      "Initial Setup: learning style, pace preferences",
      "Career Pathway Builder: up to 5 interests per student",
      "Quarterly Review: structured progress check",
    ],
    tip: "Complete Initial Setup for every student in the first week",
  },
  {
    title: "Classroom Management",
    icon: Users,
    overview: "Create classes, invite students, and track progress across your classroom. Everything in one unified view.",
    keyPoints: [
      "Bulk student management",
      "Progress comparison across students",
      "Assignment tracking and grading",
    ],
    tip: "Use the classroom view to identify students who need extra support",
  },
  {
    title: "IGN-Thrive Dashboard",
    icon: Activity,
    overview: "Six-domain scoring system measuring whole-child development. Goes beyond academics to capture the full picture.",
    keyPoints: [
      "Learning/Engagement",
      "Executive Function",
      "Belonging",
      "Wellbeing",
      "Context",
      "Protective Factors",
    ],
    tip: "Focus on trends, not single scores — declining trends need attention first",
  },
  {
    title: "Early Warning System",
    icon: AlertTriangle,
    overview: "Watch/Support/Stabilize flags detect drift before crisis. Catch issues early with explainable alert cards.",
    keyPoints: [
      "Engagement drift detection",
      "Decision pattern risk analysis",
      "Context shock alerts",
      "4-part explainable cards",
    ],
    tip: "Check flags daily — early intervention prevents escalation",
  },
  {
    title: "Student Self-Assessments",
    icon: ClipboardCheck,
    overview: "Students complete daily check-ins measuring energy, stress, focus, belonging, confidence, and mood.",
    keyPoints: [
      "Consent-based data collection",
      "Feeds directly into Thrive scoring",
      "Support request alerts for immediate action",
    ],
    tip: "Review \"needs support\" flags immediately — students are asking for help",
  },
  {
    title: "Career Explorer & Pathways",
    icon: Briefcase,
    overview: "50+ career fields across college, trade, military, and entrepreneurship paths. Every path is valued equally.",
    keyPoints: [
      "Equal representation of all education paths",
      "Student interest tracking over time",
      "Milestone-based progression system",
    ],
    tip: "Encourage students to explore careers outside their initial interests",
  },
  {
    title: "Longitudinal Tracking (6-12+)",
    icon: Route,
    overview: "Track every student from 6th grade through graduation and beyond. Build a complete developmental picture over years.",
    keyPoints: [
      "Grade-level milestones",
      "Portfolio evidence uploads",
      "Revision workflows (3x/year max)",
    ],
    tip: "Review pending revisions weekly — students need timely feedback",
  },
  {
    title: "Mentor Network",
    icon: UserPlus,
    overview: "Connect students with local professionals and community mentors. Build meaningful career connections.",
    keyPoints: [
      "Admin approval required for all mentors",
      "Career field matching algorithm",
      "Session tracking and feedback",
    ],
    tip: "Build your mentor pipeline through community partnerships and Minority Center of Excellence",
  },
  {
    title: "GIS Context Engine",
    icon: MapPin,
    overview: "Public health, social vulnerability, and safety data layered for context-aware support. Understand the world your students live in.",
    keyPoints: [
      "CDC PLACES health data",
      "SVI social vulnerability index",
      "FBI crime data — no personal addresses stored",
    ],
    tip: "Use context data to allocate resources, not to label students",
  },
  {
    title: "Virtual Economy & Marketplace",
    icon: Wallet,
    overview: "Stock market simulation, wallets, and peer marketplace with content moderation. Financial literacy made real.",
    keyPoints: [
      "Financial literacy through simulation",
      "Content filtering for safety",
      "Student report system for flagged items",
    ],
    tip: "Monitor flagged content daily and use teachable moments",
  },
  {
    title: "Financial Literacy Academy",
    icon: DollarSign,
    overview: "Comprehensive financial education with 9 modules covering investing patience, scam detection, predatory practices, residual income, data-driven decisions, and real-world business stories. Features relatable examples of athletes and rappers who lost millions (Allen Iverson, Antoine Walker) versus those who built empires (LeBron James, Shaq, Jay-Z).",
    keyPoints: [
      "9 structured modules with real-world examples and stories",
      "Scam and pyramid scheme detection with clear red flags",
      "Predatory lending and interest rate awareness",
      "Residual income concepts (laundromats, car washes, royalties)",
      "Embedded tips on Stock Market and Marketplace pages",
      "Key financial terms glossary for each module",
      "Real athlete and rapper success/failure stories for relatability",
      "Data-Driven Decisions module ties platform analytics to real-world skills",
    ],
    tip: "Review the modules with students during advisory period — the scam detection and predatory lending modules are especially important for real-world safety",
  },
  {
    title: "Data-Driven Decision Making",
    icon: BarChart3,
    overview: "The platform's built-in analytics tools teach students to read data and make evidence-based decisions. Thrive Dashboard scores, Stock Market trends, Panther Power breakdowns, Marketplace analytics, and self-assessment check-ins all generate real data students learn to interpret and act on.",
    keyPoints: [
      "Thrive Dashboard shows 6-domain scores with trend lines for self-awareness",
      "Stock Market charts teach pattern recognition and trend analysis",
      "Panther Power breakdown reveals growth areas across 5 categories",
      "Marketplace data teaches supply, demand, and pricing strategy",
      "Self-assessment check-ins build personal data literacy over time",
      "Same analytical skills used by Austin businesses and professional organizations",
    ],
    tip: "Encourage students to check their Thrive Dashboard and Panther Power breakdown weekly -- building the habit of data review is as important as the insights themselves",
  },
  {
    title: "Panther Power & Houses",
    icon: Zap,
    overview: "Five empowerment categories plus house competition system. Build character and community through friendly rivalry.",
    keyPoints: [
      "Education score",
      "Character score",
      "Leadership score",
      "Entrepreneurship score",
      "Community score & house points",
    ],
    tip: "Celebrate house achievements publicly to build belonging",
  },
  {
    title: "Panther Game Room",
    icon: Gamepad2,
    overview: "Educational gaming platform with Dominoes (fully playable), plus Checkers, Chess, Memory Match, Spades, and Strategy Tiles. Games build strategic thinking while tracking play time and ratings.",
    keyPoints: [
      "Dominoes with 4 CPU difficulty levels (Beginner to Expert)",
      "ELO rating system and school-wide leaderboard",
      "Special timer/draw mechanics teaching time management",
      "Play session tracking with 35+ minute admin flags",
      "Earns Panther Power points in Education and Leadership",
      "Live online player count shows campus engagement",
    ],
    tip: "Monitor the admin play-time flags daily — students playing over 35 minutes may need a gentle redirect to other activities",
  },
  {
    title: "Reports & Safety",
    icon: Shield,
    overview: "Content moderation, student reports, and intervention tracking. Keep your campus safe and documented.",
    keyPoints: [
      "Flagged content queue",
      "Admin notes per student",
      "Intervention playbooks",
    ],
    tip: "Document everything — notes create accountability and continuity",
  },
  {
    title: "Spark & Sparky AI Companions",
    icon: Wand2,
    overview: "Two AI companions serve different audiences. Spark helps students with grade-appropriate learning support, Socratic questioning, and emotional intelligence. Sparky helps parents and teachers with evidence-based strategies and student progress insights.",
    keyPoints: [
      "Spark: age-appropriate for students with safety guardrails",
      "Sparky: adult-level support for parents and teachers",
      "Bilingual English/Spanish support",
      "Growth mindset and cultural awareness built in",
      "Powered by configurable AI — currently Google Gemini Flash (free)",
    ],
    tip: "Encourage parents to try Sparky during onboarding — it helps them understand and support their child's progress",
  },
  {
    title: "AI Creation Studio",
    icon: Briefcase,
    overview: "A suite of 10 AI-powered productivity tools including Presentation Builder, Business Plan Generator, Research Assistant, and more. Students unlock tools by completing AI Mastery modules. Adults access all tools through Sparky.",
    keyPoints: [
      "10 AI-powered tools with wizard workflows",
      "Module-gated for students (complete AI courses to unlock)",
      "Ungated for adults via Sparky (?mode=adult)",
      "Wizard workflows connect tools (brainstorm to business plan to pitch to presentation)",
      "Project saving and portfolio integration",
    ],
    tip: "Have students start with Brainstorm Studio — it's the gateway to all other tools through wizard workflows",
  },
  {
    title: "AI Provider Configuration",
    icon: Shield,
    overview: "The platform uses a flexible AI provider system. By default, it runs on Google Gemini Flash for free. Schools can plug in their own AI provider (OpenAI, Anthropic, etc.) by setting a single API key — no code changes needed.",
    keyPoints: [
      "Default: Google Gemini Flash (free, no credit card needed)",
      "School option: Bring your own OpenAI or Anthropic key",
      "Provider switch requires only an environment variable change",
      "Built-in safety filters for student interactions",
      "See Implementation Plan page for full cost comparison",
    ],
    tip: "Start with the free Gemini tier — it handles 60+ students easily. Upgrade only if your district requires a specific provider",
  },
  {
    title: "Implementation Planning",
    icon: Route,
    overview: "A comprehensive planning guide for district administrators. Includes grade-by-grade deployment strategy (6-12), pre-rollout checklists, AI cost comparison calculator, and a phased rollout timeline.",
    keyPoints: [
      "Grade-by-grade deployment cards (6th through 12th)",
      "4-phase pre-rollout checklist",
      "AI framework evaluation with strengths and gaps",
      "Cost comparison calculator with free tier toggle",
      "Sustainability risk analysis",
    ],
    tip: "Share the Implementation Plan page with district leadership — it demonstrates the platform's scalability and zero AI cost",
  },
  {
    title: "Getting Started Checklist",
    icon: CheckCircle,
    overview: "Your first-week action plan. Follow these steps to get your campus fully operational.",
    keyPoints: [
      "Set up classrooms",
      "Run Initial Setup wizard for each student",
      "Seed mentors from community partners",
      "Review Thrive dashboard",
      "Explore Career Explorer",
      "Check GIS data for your area",
      "Set up parent notifications",
      "Explore the Game Room and review play-time settings",
      "Introduce Financial Literacy modules during first month",
      "Introduce Spark to students and Sparky to parents",
      "Walk through AI Creation Studio tools with teachers",
      "Review AI provider settings (default: free Gemini)",
      "Share Implementation Plan with district leadership",
    ],
    isChecklist: true,
    tip: "You're building the future — one student at a time",
  },
];

export default function AcademyAdminTutorialPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;
  const totalSlides = slides.length;
  const progressPercent = ((currentSlide + 1) / totalSlides) * 100;

  const goNext = () => {
    if (currentSlide < totalSlides - 1) setCurrentSlide(currentSlide + 1);
  };

  const goPrev = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto" data-testid="admin-tutorial-page">
      <div className="mb-6">
        <div className="rounded-md p-4 bg-gradient-to-r from-rose-900 to-red-950 text-white mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-admin-tutorial-title">
            AI Mastery Academy Admin Guide
          </h1>
          <p className="text-sm text-white/80 mt-1">
            A complete walkthrough of every platform management feature
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground" data-testid="text-slide-counter">
            Slide {currentSlide + 1} of {totalSlides}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progressPercent)}% complete
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" data-testid="progress-bar" />
      </div>

      <Card className="p-4 sm:p-6" data-testid={`slide-card-${currentSlide}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-md p-2.5 bg-gradient-to-br from-rose-900 to-red-950 shrink-0">
            <SlideIcon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold" data-testid="text-slide-title">
            {slide.title}
          </h2>
        </div>

        <p className="text-muted-foreground mb-5" data-testid="text-slide-overview">
          {slide.overview}
        </p>

        <div className="mb-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {slide.isChecklist ? "Checklist" : "Key Features"}
          </h3>
          <div className="space-y-2">
            {slide.keyPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2">
                {slide.isChecklist ? (
                  <button
                    type="button"
                    onClick={() => toggleCheck(idx)}
                    className="mt-0.5 shrink-0"
                    data-testid={`checklist-item-${idx}`}
                  >
                    <CheckCircle
                      className={`h-4 w-4 ${checkedItems[idx] ? "text-emerald-500" : "text-muted-foreground/40"}`}
                    />
                  </button>
                ) : (
                  <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs px-1.5">
                    {idx + 1}
                  </Badge>
                )}
                <span
                  className={`text-sm ${slide.isChecklist && checkedItems[idx] ? "line-through text-muted-foreground" : ""}`}
                  data-testid={`text-key-point-${idx}`}
                >
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md bg-amber-500/10 dark:bg-amber-500/5 p-3 flex items-start gap-2.5">
          <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm" data-testid="text-slide-tip">
            <span className="font-semibold">Tip:</span> {slide.tip}
          </p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-6">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentSlide === 0}
          data-testid="button-prev-slide"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-1 overflow-x-auto max-w-[40vw] sm:max-w-none">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-colors shrink-0 ${
                idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              data-testid={`dot-slide-${idx}`}
            />
          ))}
        </div>

        {currentSlide < totalSlides - 1 ? (
          <Button onClick={goNext} data-testid="button-next-slide">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={() => window.history.back()}
            data-testid="button-complete-tutorial"
            className="bg-gradient-to-r from-rose-900 to-red-950 text-white border-rose-900"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Complete Tutorial
          </Button>
        )}
      </div>
    </div>
  );
}
