import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { IntegrationInvitation } from "@/components/integration-invitation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Shield,
  HardHat,
  Clock,
  Crown,
  BookOpen,
  FileText,
  Award,
  Users,
  Video,
  Download,
  ChevronRight,
  CheckCircle2,
  Star,
  Smartphone,
  MessageCircle,
  Calendar,
  ExternalLink,
  Sparkles,
  Heart,
  Target,
  Lightbulb,
} from "lucide-react";
import { Link } from "wouter";
import { EvidenceSummary } from "@/components/evidence-label";

interface ModuleData {
  id: string;
  title: string;
  description: string;
  icon: typeof Briefcase;
  color: string;
  bgColor: string;
  borderColor: string;
  character: string;
  characterStory: string;
  lessons: number;
  resumeSection: string;
  weeklyTopics: string[];
}

const MODULES: ModuleData[] = [
  {
    id: "wr_professional_presence",
    title: "Professional Presence",
    description: "First impressions, communication, interviewing, and starting your resume. You already have more skills than you think.",
    icon: Briefcase,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    character: "Jaylen",
    characterStory: "16, just got hired at H-E-B. Follow his journey from nervous first day to confident team member.",
    lessons: 4,
    resumeSection: "Header, Objective, Education",
    weeklyTopics: ["Download ThriveUp PWA", "Professional Identity Inventory", "AI Mock Interview Lab"],
  },
  {
    id: "wr_workplace_rights",
    title: "Workplace Rights & Responsibilities",
    description: "Know your rights before you clock in. Discrimination, harassment, digital rights, and how to protect yourself.",
    icon: Shield,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    borderColor: "border-purple-200 dark:border-purple-800",
    character: "Aaliyah",
    characterStory: "17, works at a clothing store. When her manager asks her to work off the clock, she learns her rights.",
    lessons: 4,
    resumeSection: "Skills Section",
    weeklyTopics: ["Is This Discrimination? scenarios", "Bystander Intervention practice", "Digital Presence Audit"],
  },
  {
    id: "wr_workplace_safety",
    title: "Workplace Safety Essentials",
    description: "They can't make you do that. OSHA basics, hazard ID, PPE, emergency response, and your right to a safe workplace.",
    icon: HardHat,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    borderColor: "border-orange-200 dark:border-orange-800",
    character: "Marcus",
    characterStory: "16, works at a warehouse. When his supervisor tells him to climb a broken ladder, Marcus learns to say no.",
    lessons: 4,
    resumeSection: "Certifications & Training",
    weeklyTopics: ["Workplace Hazard Hunt", "PPE Matching Challenge", "Emergency Scenario Walkthroughs"],
  },
  {
    id: "wr_time_management",
    title: "Time & Priority Management",
    description: "Balance school, work, family, and your life without burning out. Systems that actually stick.",
    icon: Clock,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-200 dark:border-green-800",
    character: "Sofia",
    characterStory: "17, taking AP classes, working at Chick-fil-A, helping her mom with her little brother. She's exhausted.",
    lessons: 4,
    resumeSection: "Projects & Accomplishments",
    weeklyTopics: ["Eisenhower Matrix", "Digital Calendar Setup", "SMART Goal Workshop"],
  },
  {
    id: "wr_work_ethic_leadership",
    title: "Work Ethic & Career Leadership",
    description: "What separates people who get promoted from people who stay stuck? Character, consistency, and understanding the game.",
    icon: Crown,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    character: "DeAndre",
    characterStory: "18, about to graduate. When his manager asks him to train new employees, DeAndre discovers what leadership really means.",
    lessons: 4,
    resumeSection: "Final Polish + Cover Letter",
    weeklyTopics: ["Work Ethic Self-Assessment", "Org Chart Builder", "Leadership Style Quiz"],
  },
];

const ECOSYSTEM_TOOLS = [
  { name: "AI Mock Interview Lab", desc: "Practice interviews 24/7 with AI coaching", icon: MessageCircle, link: "/ai-tools" },
  { name: "Career Pathways", desc: "Explore industries and salary data", icon: Target, link: "/academy/careers" },
  { name: "Financial Literacy Hub", desc: "Learn to manage your first paycheck", icon: Lightbulb, link: "/financial-literacy" },
  { name: "Community Resource Directory", desc: "Find free professional resources near you", icon: Users, link: "/resource-directory" },
  { name: "Neighborhood Intelligence", desc: "Understand your local job market", icon: ExternalLink, link: "/neighborhood" },
  { name: "Apprenticeship Tracker", desc: "Explore paid training opportunities", icon: Award, link: "/apprenticeship-tracker" },
];

export default function WorkforceReadinessPage() {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const { data: modules, isLoading } = useQuery<any[]>({
    queryKey: ["/api/ai-curriculum/modules"],
  });

  const wrModules = modules?.filter((m: any) =>
    ["wr_professional_presence", "wr_workplace_rights", "wr_workplace_safety", "wr_time_management", "wr_work_ethic_leadership"].includes(m.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <IntegrationInvitation
          surface="workforce-readiness"
          prompt="Are you already teaching the trade without a title?"
          description="Driveway journeymen, family-shop mechanics, contractor uncles training their nephews, retired electricians coaching neighborhood kids, foremen mentoring undocumented crews — you ARE workforce development. No card required. You decide what becomes visible."
          suggestedRoleTags={["driveway journeyman", "family-shop mechanic", "informal trade instructor", "retired tradesperson", "bilingual jobsite mentor", "apprentice sponsor", "shop foreman"]}
        />
        {/* Hero */}
        <div className="text-center space-y-4" data-testid="hero-section">
          <Badge variant="outline" className="text-indigo-600 border-indigo-300 dark:text-indigo-400 dark:border-indigo-700 text-sm px-4 py-1">
            TEKS &sect;127.15 Aligned &bull; CTE Grades 9-12
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Workforce Readiness Academy
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Your career starts here. 15 weeks. 5 modules. 20 lessons. Build real workplace skills,
            create your professional resume, and earn your Workforce Readiness Certificate.
          </p>
          <p className="text-base text-indigo-600 dark:text-indigo-400 font-medium">
            Designed for YOU &mdash; phone-first, culturally responsive, with AI-powered coaching
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-start-program">
              <Smartphone className="w-5 h-5 mr-2" />
              Download ThriveUp & Start
            </Button>
            <Link href="/curriculum">
              <Button size="lg" variant="outline" data-testid="button-view-curriculum">
                <BookOpen className="w-5 h-5 mr-2" />
                View Full Curriculum
              </Button>
            </Link>
            <Link href="/resume-builder">
              <Button size="lg" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400" data-testid="button-resume-builder">
                <FileText className="w-5 h-5 mr-2" />
                Resume Builder
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4" data-testid="stats-bar">
          {[
            { label: "Modules", value: "5", icon: BookOpen },
            { label: "Lessons", value: "20", icon: FileText },
            { label: "Quiz Questions", value: "50", icon: CheckCircle2 },
            { label: "Badges", value: "11", icon: Award },
            { label: "Weeks", value: "15", icon: Calendar },
          ].map((s) => (
            <Card key={s.label} className="p-4 text-center border-gray-200 dark:border-gray-700" data-testid={`stat-${s.label.toLowerCase()}`}>
              <s.icon className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            </Card>
          ))}
        </div>
        <EvidenceSummary claims={[{ value: null, unit: "", source: "TCAF Curriculum Library", sourceId: "tcaf-curriculum", asOfDate: null, geographyKey: null, confidence: "verified", decisionCaption: "Workforce readiness curriculum counts and content are drawn from the TCAF Curriculum Library." }]} />

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/50" data-testid="feature-neighborhood-champions">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Neighborhood Champions</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Local professionals, business owners, and faith leaders from YOUR community share real-world wisdom
              and serve as your mentors throughout the program.
            </p>
          </Card>
          <Card className="p-5 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50" data-testid="feature-live-checkins">
            <div className="flex items-center gap-3 mb-2">
              <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Live Check-Ins</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Virtual sessions every week — ask questions, hear from neighborhood champions,
              share wins, and stay motivated with your cohort.
            </p>
          </Card>
          <Card className="p-5 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/50" data-testid="feature-video-motivation">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Video Motivation</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Regular motivational video posts from champions and peers who've been where you are.
              Real stories, real encouragement, real progress.
            </p>
          </Card>
        </div>

        {/* PWA Download CTA */}
        <Card className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0" data-testid="pwa-download-cta">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Smartphone className="w-8 h-8" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold">Day 1: Download ThriveUp to Your Phone</h3>
              <p className="text-indigo-100 mt-1">
                On your phone's browser, visit this site and tap "Add to Home Screen" or "Install App."
                Get 24/7 access to your resume builder, AI interview practice, lessons, and badges.
              </p>
            </div>
            <Button size="lg" variant="secondary" className="bg-white text-indigo-700 hover:bg-indigo-50" data-testid="button-install-pwa">
              <Download className="w-5 h-5 mr-2" />
              Install Now
            </Button>
          </div>
        </Card>

        {/* Module Cards */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2" data-testid="text-curriculum-heading">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            The Curriculum
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Each module follows a relatable student character through real workplace situations.
            Resume building is threaded throughout — you add a new section every module.
          </p>

          <div className="space-y-4 pt-2">
            {MODULES.map((mod, i) => {
              const isExpanded = expandedModule === mod.id;
              const Icon = mod.icon;
              return (
                <Card
                  key={mod.id}
                  className={`overflow-hidden transition-all duration-200 ${mod.borderColor} ${isExpanded ? mod.bgColor : ""}`}
                  data-testid={`module-card-${mod.id}`}
                >
                  <button
                    onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                    className="w-full p-5 flex items-start gap-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                    data-testid={`button-toggle-module-${mod.id}`}
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${mod.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${mod.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">Module {i + 1}</Badge>
                        <Badge variant="outline" className="text-xs">3 weeks</Badge>
                        <Badge variant="outline" className="text-xs">{mod.lessons} lessons</Badge>
                      </div>
                      <h3 className="text-lg font-semibold mt-1 text-gray-900 dark:text-white">{mod.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{mod.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 mt-1 ${isExpanded ? "rotate-90" : ""}`} />
                  </button>

                  {isExpanded && (
                    <div className={`px-5 pb-5 space-y-4 border-t ${mod.borderColor}`}>
                      {/* Character Story */}
                      <div className="pt-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                          <Heart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Meet {mod.character}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{mod.characterStory}</p>
                        </div>
                      </div>

                      {/* Resume Building */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Resume Builder</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">This module adds: <strong>{mod.resumeSection}</strong></p>
                        </div>
                      </div>

                      {/* Activities */}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Activities</p>
                        <div className="flex flex-wrap gap-2">
                          {mod.weeklyTopics.map((topic) => (
                            <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
                          ))}
                        </div>
                      </div>

                      <Link href="/curriculum">
                        <Button variant="outline" size="sm" className={mod.color} data-testid={`button-start-${mod.id}`}>
                          Start Module {i + 1}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Resume Threading Visualization */}
        <Card className="p-6 border-gray-200 dark:border-gray-700" data-testid="resume-threading">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-500" />
            Resume Building — Threaded Across All 5 Modules
          </h3>
          <div className="grid md:grid-cols-5 gap-3">
            {[
              { mod: 1, section: "Header + Objective + Education", color: "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700" },
              { mod: 2, section: "Skills Section", color: "bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700" },
              { mod: 3, section: "Certifications & Training", color: "bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700" },
              { mod: 4, section: "Projects & Accomplishments", color: "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700" },
              { mod: 5, section: "Final Polish + Cover Letter", color: "bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700" },
            ].map((r) => (
              <div key={r.mod} className={`p-3 rounded-lg border text-center ${r.color}`}>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Module {r.mod}</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{r.section}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
            By Module 5, you have a complete, professional resume built from YOUR real experiences.
          </p>
        </Card>

        {/* Ecosystem Tools */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2" data-testid="text-ecosystem-heading">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Connected Ecosystem Tools
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your Workforce Readiness journey connects to the full ThriveUp platform.
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            {ECOSYSTEM_TOOLS.map((tool) => (
              <Link key={tool.name} href={tool.link}>
                <Card className="p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors cursor-pointer h-full" data-testid={`tool-${tool.name.toLowerCase().replace(/\s/g, "-")}`}>
                  <div className="flex items-start gap-3">
                    <tool.icon className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{tool.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tool.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Certificate Section */}
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800" data-testid="certificate-section">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <Award className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">ThriveUp Workforce Readiness Certificate</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Complete all 5 modules, pass all quizzes, and finish your resume to earn a verifiable certificate.
                Shareable on LinkedIn, printable for your portfolio, recognized by employers.
              </p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Verifiable ID</Badge>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">LinkedIn Shareable</Badge>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">TEKS Aligned</Badge>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Employer Recognized</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Real Talk Section */}
        <Card className="p-6 border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/30" data-testid="real-talk-section">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Real Talk: This Curriculum Is Built FOR You, Not AT You
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="space-y-2">
              <p><strong>No printer?</strong> Your resume lives on ThriveUp &mdash; always accessible from your phone.</p>
              <p><strong>Can't afford interview clothes?</strong> We connect you to free professional clothing resources.</p>
              <p><strong>No references?</strong> Teachers, coaches, church leaders, and family friends all count.</p>
            </div>
            <div className="space-y-2">
              <p><strong>No transportation?</strong> Community Resource Directory finds ride options near you.</p>
              <p><strong>Nervous about interviews?</strong> Practice privately with AI at midnight if you want. Nobody's watching.</p>
              <p><strong>Family responsibilities?</strong> We acknowledge you're juggling more than most. This program works around YOUR life.</p>
            </div>
          </div>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center space-y-4 py-6" data-testid="bottom-cta">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            You started with skills you didn't know how to name.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            You'll end with a resume, a certificate, a network, and a plan.<br />
            That's not just workforce readiness. <strong>That's agency.</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-begin-journey">
              <Star className="w-5 h-5 mr-2" />
              Begin Your Journey
            </Button>
            <Link href="/curriculum">
              <Button size="lg" variant="outline" data-testid="button-explore-curriculum">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore All Lessons
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
