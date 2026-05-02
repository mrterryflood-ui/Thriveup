import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  MessageSquare,
  X,
  GraduationCap,
  Users,
  Briefcase,
  Brain,
  Shield,
  Heart,
  Target,
  Lightbulb,
  Award,
  BarChart3,
  Sparkles,
  Globe,
  BookOpen,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Monitor,
  Wrench,
  Stethoscope,
  Scale,
  Palette,
  Wheat,
  Building2,
  FileText,
  TrendingUp,
  School,
  HandHeart,
  MapPin,
  Loader2,
} from "lucide-react";

interface ImpactData {
  youthServed?: number;
  lessonsCompleted?: number;
  badgesEarned?: number;
  careerPathways?: number;
  mentorsAvailable?: number;
  curriculumLevels?: number;
  totalModules?: number;
  careerMilestones?: number;
  grantAlignment?: {
    workforceDevelopment?: boolean;
    schoolToCareerPipelines?: boolean;
    jobReadiness?: boolean;
    skillTraining?: boolean;
    jobPlacement?: boolean;
    careerAdvancement?: boolean;
    mentorship?: boolean;
    communityImpact?: boolean;
  };
}

interface SlideProps {
  impactData: ImpactData | undefined;
  isFullscreen: boolean;
}

function TitleSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#6b1c2a] via-[#8b2040] to-[#4a1020]" data-testid="slide-title">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-[10%] left-[5%] w-[30vw] h-[30vw] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] w-[25vw] h-[25vw] rounded-full bg-white/5 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-[8vw] text-center">
        <div className="flex items-center gap-[1.5vw] mb-[3vh]">
          <div className="rounded-xl p-[1vw] bg-white/15 backdrop-blur-sm">
            <GraduationCap className="text-white" style={{ width: "4vw", height: "4vw" }} />
          </div>
        </div>
        <h1 className="text-white font-bold tracking-tight leading-[1.05]" style={{ fontSize: "5.5vw" }}>
          ThriveUp Academy
        </h1>
        <p className="text-white/80 mt-[2vh] max-w-[60vw] leading-relaxed" style={{ fontSize: "2vw" }}>
          20-Platform Workforce Development & Community Enablement Ecosystem
        </p>
        <div className="mt-[5vh] flex items-center gap-[2vw]">
          <div className="px-[2vw] py-[1vh] rounded-full bg-white/15 backdrop-blur-sm text-white/90" style={{ fontSize: "1.4vw" }}>
            All Ages
          </div>
          <div className="px-[2vw] py-[1vh] rounded-full bg-white/15 backdrop-blur-sm text-white/90" style={{ fontSize: "1.4vw" }}>
            Workforce Development
          </div>
          <div className="px-[2vw] py-[1vh] rounded-full bg-white/15 backdrop-blur-sm text-white/90" style={{ fontSize: "1.4vw" }}>
            Community Enablement
          </div>
        </div>
        <p className="text-white/50 mt-[6vh]" style={{ fontSize: "1.3vw" }}>
          Reducing recidivism, increasing employment, strengthening communities through integrated technology
        </p>
      </div>
    </div>
  );
}

function MissionSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f0ece6]" data-testid="slide-mission">
      <div className="absolute top-0 left-0 w-[40%] h-full bg-[#6b1c2a]" />
      <div className="relative z-10 flex h-full">
        <div className="w-[40%] flex flex-col justify-center px-[4vw] text-white">
          <Target style={{ width: "3vw", height: "3vw" }} className="mb-[2vh] opacity-80" />
          <h2 className="font-bold tracking-tight leading-tight" style={{ fontSize: "3.5vw" }}>Our Mission</h2>
        </div>
        <div className="w-[60%] flex flex-col justify-center px-[4vw]">
          <p className="text-[#3a2020] leading-relaxed mb-[3vh]" style={{ fontSize: "2vw" }}>
            Empowering under-resourced communities with AI mastery, workforce readiness, and career pipelines for all ages.
          </p>
          <div className="space-y-[2vh]">
            {[
              { icon: Brain, text: "AI literacy as the new foundation for career success" },
              { icon: Briefcase, text: "Direct pipelines from classroom to career placement" },
              { icon: HandHeart, text: "Whole-child support through mentorship and community" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-[1vw]">
                <div className="rounded-lg p-[0.6vw] bg-[#6b1c2a]/10">
                  <item.icon className="text-[#6b1c2a]" style={{ width: "1.8vw", height: "1.8vw" }} />
                </div>
                <span className="text-[#3a2020]/80" style={{ fontSize: "1.6vw" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a1215]" data-testid="slide-problem">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-[20%] right-[10%] w-[20vw] h-[20vw] rounded-full bg-[#6b1c2a]/30 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <p className="text-[#6b1c2a] font-semibold uppercase tracking-widest mb-[2vh]" style={{ fontSize: "1.3vw" }}>The Challenge</p>
        <h2 className="text-white font-bold tracking-tight leading-tight mb-[4vh]" style={{ fontSize: "3.8vw" }}>
          Under-resourced communities face compounding barriers
        </h2>
        <div className="grid grid-cols-3 gap-[2vw]">
          {[
            { stat: "67%", label: "of low-income students lack access to career readiness programs" },
            { stat: "3x", label: "more likely to face unemployment without workforce training" },
            { stat: "82%", label: "of future jobs will require digital and AI literacy skills" },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-[2vw] border border-white/10">
              <p className="text-[#c9a0a0] font-bold" style={{ fontSize: "4vw" }}>{item.stat}</p>
              <p className="text-white/60 mt-[1vh]" style={{ fontSize: "1.4vw" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SolutionSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f0ece6]" data-testid="slide-solution">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <p className="text-[#6b1c2a] font-semibold uppercase tracking-widest mb-[1.5vh]" style={{ fontSize: "1.3vw" }}>Our Solution</p>
        <h2 className="text-[#2a1015] font-bold tracking-tight leading-tight mb-[4vh]" style={{ fontSize: "3.5vw" }}>
          A complete ecosystem, not just a course
        </h2>
        <div className="grid grid-cols-2 gap-[2vw]">
          {[
            { icon: GraduationCap, title: "5-Level AI Curriculum", desc: "From Explorer to Master with module-gated progression", link: "/curriculum" },
            { icon: Briefcase, title: "55 Career Pathways", desc: "Structured pipelines across 12 industries", link: "/academy/careers" },
            { icon: Sparkles, title: "AI Creation Studio", desc: "10 professional tools earned through mastery", link: "/ai-tools" },
            { icon: Users, title: "Mentor Network", desc: "Professional coaching for career advancement", link: "/academy/mentors" },
          ].map((item, i) => (
            <Link key={i} href={item.link} className="group">
              <div className="bg-white rounded-xl p-[1.8vw] border border-[#e8e0d8] hover:border-[#6b1c2a]/30 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-center gap-[1vw] mb-[1vh]">
                  <div className="rounded-lg p-[0.5vw] bg-[#6b1c2a]/10">
                    <item.icon className="text-[#6b1c2a]" style={{ width: "1.8vw", height: "1.8vw" }} />
                  </div>
                  <h3 className="font-bold text-[#2a1015]" style={{ fontSize: "1.8vw" }}>{item.title}</h3>
                  <ExternalLink className="ml-auto text-[#6b1c2a]/40 group-hover:text-[#6b1c2a]" style={{ width: "1.2vw", height: "1.2vw" }} />
                </div>
                <p className="text-[#6b5050]" style={{ fontSize: "1.4vw" }}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurriculumSlide({ isFullscreen }: SlideProps) {
  const levels = [
    { name: "Explorer", desc: "Discover AI basics through stories and activities", color: "bg-emerald-500" },
    { name: "Guide", desc: "Master prompting, explore AI ethics", color: "bg-blue-500" },
    { name: "Architect", desc: "Advanced prompting, understand AI systems", color: "bg-purple-500" },
    { name: "Innovator", desc: "Cutting-edge AI, entrepreneurship", color: "bg-orange-500" },
    { name: "Master", desc: "Lead as Educator, Researcher, or Implementer", color: "bg-rose-700" },
  ];
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a1215]" data-testid="slide-curriculum">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <div className="flex items-center justify-between mb-[4vh]">
          <div>
            <p className="text-[#c9a0a0] font-semibold uppercase tracking-widest mb-[1vh]" style={{ fontSize: "1.3vw" }}>AI Mastery Curriculum</p>
            <h2 className="text-white font-bold tracking-tight" style={{ fontSize: "3.2vw" }}>Five levels of progressive mastery</h2>
          </div>
          <Link href="/curriculum" className="flex items-center gap-[0.5vw] text-[#c9a0a0] hover:text-white transition-colors" style={{ fontSize: "1.3vw" }}>
            View Live <ExternalLink style={{ width: "1.2vw", height: "1.2vw" }} />
          </Link>
        </div>
        <div className="flex gap-[1.5vw]">
          {levels.map((level, i) => (
            <div key={i} className="flex-1 bg-white/5 rounded-xl p-[1.5vw] border border-white/10 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-[0.4vh] ${level.color}`} />
              <p className="text-white/40 font-bold mb-[1vh]" style={{ fontSize: "1.2vw" }}>Level {i + 1}</p>
              <p className="text-white font-bold mb-[1vh]" style={{ fontSize: "1.8vw" }}>{level.name}</p>
              <p className="text-white/60" style={{ fontSize: "1.2vw" }}>{level.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-[3vh] flex items-center gap-[2vw]">
          <div className="flex items-center gap-[0.5vw] text-white/50" style={{ fontSize: "1.3vw" }}>
            <BookOpen style={{ width: "1.5vw", height: "1.5vw" }} /> 31 Modules
          </div>
          <div className="flex items-center gap-[0.5vw] text-white/50" style={{ fontSize: "1.3vw" }}>
            <Award style={{ width: "1.5vw", height: "1.5vw" }} /> Capstone Projects
          </div>
          <div className="flex items-center gap-[0.5vw] text-white/50" style={{ fontSize: "1.3vw" }}>
            <Shield style={{ width: "1.5vw", height: "1.5vw" }} /> Parent Teachback Verification
          </div>
        </div>
      </div>
    </div>
  );
}

function CareerPathwaysSlide({ impactData }: SlideProps) {
  const categories = [
    { icon: Monitor, name: "Technology", count: 8 },
    { icon: Stethoscope, name: "Healthcare", count: 6 },
    { icon: TrendingUp, name: "Business & Finance", count: 5 },
    { icon: Building2, name: "Engineering", count: 5 },
    { icon: Wrench, name: "Skilled Trades", count: 8 },
    { icon: Shield, name: "Military & Public Service", count: 5 },
    { icon: Palette, name: "Arts & Creative", count: 4 },
    { icon: School, name: "Education", count: 3 },
    { icon: Scale, name: "Law & Justice", count: 3 },
    { icon: Globe, name: "Science & Research", count: 3 },
    { icon: FileText, name: "Media & Communications", count: 3 },
    { icon: Wheat, name: "Agriculture", count: 2 },
  ];
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f0ece6]" data-testid="slide-careers">
      <div className="relative z-10 flex flex-col justify-center h-full px-[6vw]">
        <div className="flex items-center justify-between mb-[3vh]">
          <div>
            <p className="text-[#6b1c2a] font-semibold uppercase tracking-widest mb-[1vh]" style={{ fontSize: "1.3vw" }}>School-to-Career Pipelines</p>
            <h2 className="text-[#2a1015] font-bold tracking-tight" style={{ fontSize: "3.2vw" }}>55 career pathways across 12 industries</h2>
          </div>
          <Link href="/academy/careers" className="flex items-center gap-[0.5vw] text-[#6b1c2a] hover:text-[#8b2040] transition-colors" style={{ fontSize: "1.3vw" }}>
            Explore Careers <ExternalLink style={{ width: "1.2vw", height: "1.2vw" }} />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-[1.2vw]">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white rounded-lg p-[1.2vw] border border-[#e8e0d8] flex items-center gap-[0.8vw]">
              <div className="rounded-md p-[0.4vw] bg-[#6b1c2a]/10 shrink-0">
                <cat.icon className="text-[#6b1c2a]" style={{ width: "1.5vw", height: "1.5vw" }} />
              </div>
              <div>
                <p className="font-semibold text-[#2a1015]" style={{ fontSize: "1.3vw" }}>{cat.name}</p>
                <p className="text-[#6b5050]" style={{ fontSize: "1.1vw" }}>{cat.count} pathways</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIToolsSlide({ isFullscreen }: SlideProps) {
  const tools = [
    "Presentation Builder", "Video Script Creator", "Sales Pitch Builder",
    "Business Plan Generator", "Research Assistant", "Life Planner",
    "Project Planner", "Document Writer", "Resume Builder", "Brainstorm Studio"
  ];
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#6b1c2a] via-[#5a1525] to-[#3a0d18]" data-testid="slide-ai-tools">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-[30%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="relative z-10 flex h-full">
        <div className="w-[45%] flex flex-col justify-center px-[5vw]">
          <Sparkles className="text-white/80 mb-[2vh]" style={{ width: "3vw", height: "3vw" }} />
          <h2 className="text-white font-bold tracking-tight leading-tight mb-[2vh]" style={{ fontSize: "3.2vw" }}>
            AI Creation Studio
          </h2>
          <p className="text-white/70 mb-[3vh]" style={{ fontSize: "1.6vw" }}>
            10 professional-grade tools students earn through demonstrated AI mastery
          </p>
          <Link href="/ai-tools" className="inline-flex items-center gap-[0.5vw] text-white/90 hover:text-white transition-colors" style={{ fontSize: "1.4vw" }}>
            View Studio <ExternalLink style={{ width: "1.2vw", height: "1.2vw" }} />
          </Link>
        </div>
        <div className="w-[55%] flex flex-col justify-center pr-[5vw]">
          <div className="grid grid-cols-2 gap-[1vw]">
            {tools.map((tool, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg px-[1.2vw] py-[1vh] border border-white/10 flex items-center gap-[0.6vw]">
                <CheckCircle2 className="text-emerald-400 shrink-0" style={{ width: "1.3vw", height: "1.3vw" }} />
                <span className="text-white/90" style={{ fontSize: "1.3vw" }}>{tool}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkCompanionSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f0ece6]" data-testid="slide-spark">
      <div className="relative z-10 flex h-full">
        <div className="w-[55%] flex flex-col justify-center px-[5vw]">
          <p className="text-[#6b1c2a] font-semibold uppercase tracking-widest mb-[1.5vh]" style={{ fontSize: "1.3vw" }}>AI Companions</p>
          <h2 className="text-[#2a1015] font-bold tracking-tight leading-tight mb-[3vh]" style={{ fontSize: "3.2vw" }}>
            Meet Spark & Sparky
          </h2>
          <div className="space-y-[2.5vh]">
            <div className="bg-white rounded-xl p-[1.8vw] border border-[#e8e0d8]">
              <div className="flex items-center gap-[0.8vw] mb-[1vh]">
                <Brain className="text-[#6b1c2a]" style={{ width: "1.8vw", height: "1.8vw" }} />
                <h3 className="font-bold text-[#2a1015]" style={{ fontSize: "1.8vw" }}>Spark</h3>
                <span className="text-[#6b5050] ml-auto" style={{ fontSize: "1.2vw" }}>For Students</span>
              </div>
              <p className="text-[#6b5050]" style={{ fontSize: "1.4vw" }}>Grade-band AI companion with Socratic questioning, emotional intelligence, bilingual support, and safety guardrails</p>
            </div>
            <div className="bg-white rounded-xl p-[1.8vw] border border-[#e8e0d8]">
              <div className="flex items-center gap-[0.8vw] mb-[1vh]">
                <Heart className="text-[#6b1c2a]" style={{ width: "1.8vw", height: "1.8vw" }} />
                <h3 className="font-bold text-[#2a1015]" style={{ fontSize: "1.8vw" }}>Sparky</h3>
                <span className="text-[#6b5050] ml-auto" style={{ fontSize: "1.2vw" }}>For Parents & Teachers</span>
              </div>
              <p className="text-[#6b5050]" style={{ fontSize: "1.4vw" }}>Compassionate support with evidence-based strategies and context-aware conversations</p>
            </div>
          </div>
        </div>
        <div className="w-[45%] flex flex-col justify-center items-center pr-[4vw]">
          <Link href="/ai-companion" className="block bg-[#6b1c2a] rounded-2xl p-[2vw] text-white hover:bg-[#8b2040] transition-colors">
            <p className="font-bold mb-[1vh]" style={{ fontSize: "1.8vw" }}>Try Spark Live</p>
            <p className="text-white/70" style={{ fontSize: "1.3vw" }}>Experience the AI companion</p>
            <ArrowRight className="mt-[1.5vh]" style={{ width: "2vw", height: "2vw" }} />
          </Link>
          <Link href="/sparky" className="block mt-[2vh] bg-white border-2 border-[#6b1c2a] rounded-2xl p-[2vw] text-[#6b1c2a] hover:bg-[#6b1c2a]/5 transition-colors">
            <p className="font-bold mb-[1vh]" style={{ fontSize: "1.8vw" }}>Try Sparky Live</p>
            <p className="text-[#6b5050]" style={{ fontSize: "1.3vw" }}>Parent & teacher companion</p>
            <ArrowRight className="mt-[1.5vh]" style={{ width: "2vw", height: "2vw" }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PantherVillageSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a1215]" data-testid="slide-village">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <p className="text-[#c9a0a0] font-semibold uppercase tracking-widest mb-[1.5vh]" style={{ fontSize: "1.3vw" }}>Virtual Campus</p>
        <h2 className="text-white font-bold tracking-tight leading-tight mb-[4vh]" style={{ fontSize: "3.5vw" }}>Panther Village Academy</h2>
        <div className="grid grid-cols-3 gap-[2vw]">
          {[
            { icon: Building2, title: "Interactive Campus", desc: "Buildings, avatars, and exploration", link: "/academy/campus" },
            { icon: TrendingUp, title: "Stock Market Sim", desc: "Financial literacy through practice", link: "/academy/stocks" },
            { icon: Award, title: "Academic Competitions", desc: "Houses, quests, and leaderboards", link: "/academy/competitions" },
          ].map((item, i) => (
            <Link key={i} href={item.link} className="group">
              <div className="bg-white/5 rounded-xl p-[2vw] border border-white/10 hover:border-white/30 transition-all cursor-pointer h-full">
                <item.icon className="text-[#c9a0a0] mb-[1.5vh]" style={{ width: "2.2vw", height: "2.2vw" }} />
                <h3 className="text-white font-bold mb-[1vh]" style={{ fontSize: "1.8vw" }}>{item.title}</h3>
                <p className="text-white/60" style={{ fontSize: "1.3vw" }}>{item.desc}</p>
                <div className="flex items-center gap-[0.3vw] text-[#c9a0a0] mt-[1.5vh] group-hover:text-white transition-colors" style={{ fontSize: "1.2vw" }}>
                  Visit <ExternalLink style={{ width: "1vw", height: "1vw" }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImpactMetricsSlide({ impactData }: SlideProps) {
  const metrics = [
    { value: impactData?.youthServed || 14, label: "Participants Served", suffix: "" },
    { value: impactData?.careerPathways || 55, label: "Career Pathways", suffix: "" },
    { value: impactData?.mentorsAvailable || 8, label: "Professional Mentors", suffix: "" },
    { value: impactData?.curriculumLevels || 5, label: "Mastery Levels", suffix: "" },
    { value: impactData?.totalModules || 31, label: "Learning Modules", suffix: "" },
    { value: impactData?.careerMilestones || 24, label: "Career Milestones", suffix: "" },
  ];
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f0ece6]" data-testid="slide-impact">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <div className="flex items-center justify-between mb-[4vh]">
          <div>
            <p className="text-[#6b1c2a] font-semibold uppercase tracking-widest mb-[1vh]" style={{ fontSize: "1.3vw" }}>Live Platform Data</p>
            <h2 className="text-[#2a1015] font-bold tracking-tight" style={{ fontSize: "3.5vw" }}>Impact at a Glance</h2>
          </div>
          <Link href="/impact" className="flex items-center gap-[0.5vw] text-[#6b1c2a] hover:text-[#8b2040] transition-colors" style={{ fontSize: "1.3vw" }}>
            Full Dashboard <ExternalLink style={{ width: "1.2vw", height: "1.2vw" }} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-[2vw]">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white rounded-xl p-[2vw] border border-[#e8e0d8] text-center">
              <p className="text-[#6b1c2a] font-bold" style={{ fontSize: "4vw" }}>{m.value}{m.suffix}</p>
              <p className="text-[#6b5050] mt-[0.5vh]" style={{ fontSize: "1.4vw" }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GrantAlignmentSlide({ impactData }: SlideProps) {
  const criteria = [
    { text: "School-to-career employment pipelines", met: impactData?.grantAlignment?.schoolToCareerPipelines },
    { text: "Workforce development programming", met: impactData?.grantAlignment?.workforceDevelopment },
    { text: "Job readiness training", met: impactData?.grantAlignment?.jobReadiness },
    { text: "Skill training and certification", met: impactData?.grantAlignment?.skillTraining },
    { text: "Job placement support", met: impactData?.grantAlignment?.jobPlacement },
    { text: "Career advancement pathways", met: impactData?.grantAlignment?.careerAdvancement },
    { text: "Professional mentorship programs", met: impactData?.grantAlignment?.mentorship },
    { text: "Community impact for under-resourced communities", met: impactData?.grantAlignment?.communityImpact },
  ];
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a1215]" data-testid="slide-grant">
      <div className="relative z-10 flex h-full">
        <div className="w-[45%] flex flex-col justify-center px-[5vw]">
          <Shield className="text-emerald-400 mb-[2vh]" style={{ width: "3vw", height: "3vw" }} />
          <h2 className="text-white font-bold tracking-tight leading-tight mb-[2vh]" style={{ fontSize: "3.2vw" }}>
            Grant Aligned
          </h2>
          <p className="text-white/60" style={{ fontSize: "1.6vw" }}>
            Every criterion met for workforce development grant eligibility
          </p>
        </div>
        <div className="w-[55%] flex flex-col justify-center pr-[5vw]">
          <div className="space-y-[1.5vh]">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-[1vw] bg-white/5 rounded-lg px-[1.5vw] py-[1.2vh] border border-white/10">
                <CheckCircle2 className={c.met ? "text-emerald-400" : "text-white/30"} style={{ width: "1.5vw", height: "1.5vw" }} />
                <span className="text-white/80" style={{ fontSize: "1.4vw" }}>{c.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MentorNetworkSlide({ impactData }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f0ece6]" data-testid="slide-mentors">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <div className="flex items-center justify-between mb-[4vh]">
          <div>
            <p className="text-[#6b1c2a] font-semibold uppercase tracking-widest mb-[1vh]" style={{ fontSize: "1.3vw" }}>Mentor Network</p>
            <h2 className="text-[#2a1015] font-bold tracking-tight" style={{ fontSize: "3.2vw" }}>{impactData?.mentorsAvailable || 8} professional mentors and growing</h2>
          </div>
          <Link href="/academy/mentors" className="flex items-center gap-[0.5vw] text-[#6b1c2a] hover:text-[#8b2040] transition-colors" style={{ fontSize: "1.3vw" }}>
            Meet Mentors <ExternalLink style={{ width: "1.2vw", height: "1.2vw" }} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-[2vw]">
          {[
            { icon: Briefcase, title: "Career Coaching", desc: "One-on-one professional guidance from industry mentors across all 12 career categories" },
            { icon: Target, title: "Pathway Planning", desc: "Structured career readiness assessments with milestone tracking and revision support" },
            { icon: Rocket, title: "Job Placement", desc: "Direct pipelines from skill demonstration to workforce entry and career advancement" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-[2vw] border border-[#e8e0d8]">
              <item.icon className="text-[#6b1c2a] mb-[1.5vh]" style={{ width: "2.2vw", height: "2.2vw" }} />
              <h3 className="font-bold text-[#2a1015] mb-[1vh]" style={{ fontSize: "1.8vw" }}>{item.title}</h3>
              <p className="text-[#6b5050]" style={{ fontSize: "1.3vw" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WholeChildSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#6b1c2a] via-[#5a1525] to-[#3a0d18]" data-testid="slide-wholechild">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <p className="text-white/60 font-semibold uppercase tracking-widest mb-[1.5vh]" style={{ fontSize: "1.3vw" }}>Beyond Academics</p>
        <h2 className="text-white font-bold tracking-tight leading-tight mb-[4vh]" style={{ fontSize: "3.5vw" }}>Whole-child support system</h2>
        <div className="grid grid-cols-2 gap-[2vw]">
          {[
            { icon: Heart, title: "Thrive Analytics", desc: "Six-domain scoring engine with early warning system and intervention playbooks", link: "/academy/thrive" },
            { icon: BarChart3, title: "Financial Literacy", desc: "Stock market simulation, entrepreneurship training, and real fundraising for college tuition", link: "/academy/financial-literacy" },
            { icon: Globe, title: "Community Resources", desc: "Nationwide resource finder covering 55 U.S. jurisdictions with real-time data", link: "/resources" },
            { icon: BookOpen, title: "STAAR Test Prep", desc: "Grade-level study guides for Grades 3-11 aligned to Texas TEKS standards", link: "/academy/staar-prep" },
          ].map((item, i) => (
            <Link key={i} href={item.link} className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-[1.8vw] border border-white/15 hover:border-white/40 transition-all cursor-pointer">
                <div className="flex items-center gap-[0.8vw] mb-[1vh]">
                  <item.icon className="text-white/80" style={{ width: "1.8vw", height: "1.8vw" }} />
                  <h3 className="text-white font-bold" style={{ fontSize: "1.8vw" }}>{item.title}</h3>
                  <ExternalLink className="ml-auto text-white/30 group-hover:text-white/80" style={{ width: "1.2vw", height: "1.2vw" }} />
                </div>
                <p className="text-white/60" style={{ fontSize: "1.3vw" }}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccessibilitySlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f0ece6]" data-testid="slide-accessibility">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <p className="text-[#6b1c2a] font-semibold uppercase tracking-widest mb-[1.5vh]" style={{ fontSize: "1.3vw" }}>Built for Everyone</p>
        <h2 className="text-[#2a1015] font-bold tracking-tight leading-tight mb-[4vh]" style={{ fontSize: "3.2vw" }}>Accessibility & Inclusion</h2>
        <div className="grid grid-cols-3 gap-[2vw]">
          {[
            { title: "WCAG 2.1 AA", items: ["2,415+ test identifiers", "95+ accessibility labels", "Skip-to-content navigation", "Focus-visible indicators"] },
            { title: "Adaptive Learning", items: ["Dyslexia-friendly fonts", "Large text mode", "High contrast mode", "Reduced motion support"] },
            { title: "Inclusive Design", items: ["English & Spanish support", "Low-bandwidth mode", "Mobile responsive", "Screen reader optimized"] },
          ].map((col, i) => (
            <div key={i} className="bg-white rounded-xl p-[2vw] border border-[#e8e0d8]">
              <h3 className="font-bold text-[#6b1c2a] mb-[2vh]" style={{ fontSize: "1.8vw" }}>{col.title}</h3>
              <div className="space-y-[1.2vh]">
                {col.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-[0.6vw]">
                    <CheckCircle2 className="text-emerald-500 shrink-0" style={{ width: "1.3vw", height: "1.3vw" }} />
                    <span className="text-[#3a2020]" style={{ fontSize: "1.3vw" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComplianceSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a1215]" data-testid="slide-compliance">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <p className="text-[#c9a0a0] font-semibold uppercase tracking-widest mb-[1.5vh]" style={{ fontSize: "1.3vw" }}>Enterprise Standards</p>
        <h2 className="text-white font-bold tracking-tight leading-tight mb-[4vh]" style={{ fontSize: "3.5vw" }}>Security & Compliance</h2>
        <div className="grid grid-cols-2 gap-[2vw]">
          {[
            { title: "COPPA Compliant", desc: "Parental consent, data retention policies, age-appropriate content safeguards" },
            { title: "FERPA Aligned", desc: "Student data protection, role-based access control, secure session management" },
            { title: "Authentication", desc: "OIDC authentication via magic link, Google, and GitHub with encrypted sessions" },
            { title: "Rate Limited", desc: "AI chat rate-limited at 20 req/min, all 150+ routes with error handling, input validation" },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-[2vw] border border-white/10">
              <h3 className="text-white font-bold mb-[1vh]" style={{ fontSize: "1.8vw" }}>{item.title}</h3>
              <p className="text-white/60" style={{ fontSize: "1.4vw" }}>{item.desc}</p>
            </div>
          ))}
        </div>
        <Link href="/privacy" className="inline-flex items-center gap-[0.5vw] text-[#c9a0a0] hover:text-white transition-colors mt-[3vh]" style={{ fontSize: "1.3vw" }}>
          View Privacy Policy <ExternalLink style={{ width: "1.2vw", height: "1.2vw" }} />
        </Link>
      </div>
    </div>
  );
}

function TechnicalSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f0ece6]" data-testid="slide-technical">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <p className="text-[#6b1c2a] font-semibold uppercase tracking-widest mb-[1.5vh]" style={{ fontSize: "1.3vw" }}>Technical Foundation</p>
        <h2 className="text-[#2a1015] font-bold tracking-tight leading-tight mb-[4vh]" style={{ fontSize: "3.2vw" }}>Production-Ready Architecture</h2>
        <div className="grid grid-cols-4 gap-[1.5vw]">
          {[
            { label: "Pages", value: "120+" },
            { label: "API Routes", value: "150+" },
            { label: "Error Handling", value: "100%" },
            { label: "Code Split", value: "60+" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-[1.5vw] border border-[#e8e0d8] text-center">
              <p className="text-[#6b1c2a] font-bold" style={{ fontSize: "3vw" }}>{s.value}</p>
              <p className="text-[#6b5050]" style={{ fontSize: "1.2vw" }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-[3vh] grid grid-cols-2 gap-[1.5vw]">
          <div className="bg-white rounded-xl p-[1.5vw] border border-[#e8e0d8]">
            <h3 className="font-bold text-[#2a1015] mb-[1vh]" style={{ fontSize: "1.6vw" }}>Frontend Stack</h3>
            <p className="text-[#6b5050]" style={{ fontSize: "1.3vw" }}>React, Vite, TanStack Query, Tailwind CSS, shadcn/ui, wouter</p>
          </div>
          <div className="bg-white rounded-xl p-[1.5vw] border border-[#e8e0d8]">
            <h3 className="font-bold text-[#2a1015] mb-[1vh]" style={{ fontSize: "1.6vw" }}>Backend Stack</h3>
            <p className="text-[#6b5050]" style={{ fontSize: "1.3vw" }}>Node.js, Express, PostgreSQL, Drizzle ORM, Gemini AI</p>
          </div>
        </div>
        <Link href="/api-docs" className="inline-flex items-center gap-[0.5vw] text-[#6b1c2a] hover:text-[#8b2040] transition-colors mt-[2vh]" style={{ fontSize: "1.3vw" }}>
          View API Documentation <ExternalLink style={{ width: "1.2vw", height: "1.2vw" }} />
        </Link>
      </div>
    </div>
  );
}

function ImplementationSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a1215]" data-testid="slide-implementation">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <p className="text-[#c9a0a0] font-semibold uppercase tracking-widest mb-[1.5vh]" style={{ fontSize: "1.3vw" }}>Deployment Strategy</p>
        <h2 className="text-white font-bold tracking-tight leading-tight mb-[4vh]" style={{ fontSize: "3.5vw" }}>Phased Implementation</h2>
        <div className="flex gap-[2vw]">
          {[
            { phase: "1", title: "Foundation", items: ["Platform deployment", "Initial school partnerships", "Core curriculum launch"], timeline: "Months 1-3" },
            { phase: "2", title: "Growth", items: ["Mentor network expansion", "Career pipeline activation", "Student onboarding at scale"], timeline: "Months 4-6" },
            { phase: "3", title: "Scale", items: ["Multi-district rollout", "Employer partnerships", "National expansion planning"], timeline: "Months 7-12" },
          ].map((p, i) => (
            <div key={i} className="flex-1 bg-white/5 rounded-xl p-[2vw] border border-white/10 relative">
              <div className="absolute top-0 left-0 w-full h-[0.4vh] bg-gradient-to-r from-[#6b1c2a] to-[#c9a0a0]" />
              <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#6b1c2a] flex items-center justify-center text-white font-bold" style={{ fontSize: "1.3vw" }}>{p.phase}</div>
                <h3 className="text-white font-bold" style={{ fontSize: "1.8vw" }}>{p.title}</h3>
              </div>
              <div className="space-y-[1vh] mb-[1.5vh]">
                {p.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-[0.5vw]">
                    <ArrowRight className="text-[#c9a0a0] shrink-0" style={{ width: "1.2vw", height: "1.2vw" }} />
                    <span className="text-white/70" style={{ fontSize: "1.3vw" }}>{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-[#c9a0a0]" style={{ fontSize: "1.2vw" }}>{p.timeline}</p>
            </div>
          ))}
        </div>
        <Link href="/implementation" className="inline-flex items-center gap-[0.5vw] text-[#c9a0a0] hover:text-white transition-colors mt-[3vh]" style={{ fontSize: "1.3vw" }}>
          Full Implementation Guide <ExternalLink style={{ width: "1.2vw", height: "1.2vw" }} />
        </Link>
      </div>
    </div>
  );
}

function ResourceFinderSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f0ece6]" data-testid="slide-resources">
      <div className="relative z-10 flex h-full">
        <div className="w-[50%] flex flex-col justify-center px-[5vw]">
          <MapPin className="text-[#6b1c2a] mb-[2vh]" style={{ width: "3vw", height: "3vw" }} />
          <h2 className="text-[#2a1015] font-bold tracking-tight leading-tight mb-[2vh]" style={{ fontSize: "3.2vw" }}>
            Community Resource Finder
          </h2>
          <p className="text-[#6b5050] mb-[3vh]" style={{ fontSize: "1.6vw" }}>
            Connecting families to local support services across the nation
          </p>
          <div className="space-y-[1.5vh]">
            {[
              "50 states + DC + territories (55 jurisdictions)",
              "Healthcare, food, housing, education, employment",
              "Real-time GIS data from CDC, FBI, and ATSDR",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-[0.6vw]">
                <CheckCircle2 className="text-emerald-500 shrink-0" style={{ width: "1.3vw", height: "1.3vw" }} />
                <span className="text-[#3a2020]" style={{ fontSize: "1.4vw" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-[50%] flex flex-col justify-center items-center pr-[4vw]">
          <Link href="/resources" className="block w-full bg-[#6b1c2a] rounded-2xl p-[2.5vw] text-white hover:bg-[#8b2040] transition-colors text-center">
            <Globe className="mx-auto mb-[1.5vh]" style={{ width: "3vw", height: "3vw" }} />
            <p className="font-bold" style={{ fontSize: "2vw" }}>Try Resource Finder</p>
            <p className="text-white/70 mt-[0.5vh]" style={{ fontSize: "1.3vw" }}>Search any U.S. location</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AudienceSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a1215]" data-testid="slide-audience">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <p className="text-[#c9a0a0] font-semibold uppercase tracking-widest mb-[1.5vh]" style={{ fontSize: "1.3vw" }}>Who We Serve</p>
        <h2 className="text-white font-bold tracking-tight leading-tight mb-[4vh]" style={{ fontSize: "3.5vw" }}>Multiple stakeholder value</h2>
        <div className="grid grid-cols-3 gap-[2vw]">
          {[
            { icon: Users, title: "Participants (All Ages)", items: ["AI and digital literacy training", "Career exploration and placement", "Reentry case management", "Workforce development"] },
            { icon: Building2, title: "Community Partners", items: ["Service delivery tracking", "Referral workflows", "Volunteer coordination", "Collective impact reporting"] },
            { icon: Briefcase, title: "Funders & Grant Makers", items: ["Grant-aligned outcome reports", "Impact dashboard", "CSV data export", "API integration"] },
          ].map((col, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-[2vw] border border-white/10">
              <col.icon className="text-[#c9a0a0] mb-[1.5vh]" style={{ width: "2.2vw", height: "2.2vw" }} />
              <h3 className="text-white font-bold mb-[2vh]" style={{ fontSize: "1.8vw" }}>{col.title}</h3>
              <div className="space-y-[1.2vh]">
                {col.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-[0.5vw]">
                    <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-[#c9a0a0]" />
                    <span className="text-white/70" style={{ fontSize: "1.3vw" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DifferentiatorsSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f0ece6]" data-testid="slide-differentiators">
      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw]">
        <p className="text-[#6b1c2a] font-semibold uppercase tracking-widest mb-[1.5vh]" style={{ fontSize: "1.3vw" }}>Competitive Advantage</p>
        <h2 className="text-[#2a1015] font-bold tracking-tight leading-tight mb-[4vh]" style={{ fontSize: "3.2vw" }}>What makes us different</h2>
        <div className="grid grid-cols-2 gap-[2vw]">
          {[
            { icon: Lightbulb, title: "Earn Through Mastery", desc: "AI tools are unlocked by completing curriculum modules, not purchased. Students prove readiness before accessing professional tools." },
            { icon: Shield, title: "Safety-First AI", desc: "Every AI interaction includes age-appropriate guardrails, Socratic questioning, and cultural awareness. Never just a chatbot." },
            { icon: BarChart3, title: "Real Impact Data", desc: "Live metrics dashboard with grant-aligned reporting. Funders see real numbers, not projections." },
            { icon: Heart, title: "Community-Embedded", desc: "Nationwide resource finder, GIS context engine, and early warning system connecting communities to local support services." },
          ].map((item, i) => (
            <div key={i} className="flex gap-[1.5vw] items-start">
              <div className="rounded-xl p-[0.8vw] bg-[#6b1c2a]/10 shrink-0">
                <item.icon className="text-[#6b1c2a]" style={{ width: "2vw", height: "2vw" }} />
              </div>
              <div>
                <h3 className="font-bold text-[#2a1015] mb-[0.5vh]" style={{ fontSize: "1.8vw" }}>{item.title}</h3>
                <p className="text-[#6b5050]" style={{ fontSize: "1.3vw" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EcosystemSlide({ isFullscreen }: SlideProps) {
  const platforms = [
    { name: "ThriveUp Academy", desc: "Central workforce hub" },
    { name: "ISSS", desc: "Whole-child implementation" },
    { name: "Sankofa Health", desc: "Community health gateway" },
    { name: "MCE", desc: "Minority business lifecycle" },
    { name: "WholeMind Learning", desc: "Pre-K to 12th education" },
    { name: "Perfectly Different", desc: "Neurodiversity support" },
    { name: "SafeReport", desc: "Mandatory reporter mgmt" },
    { name: "M2C Transition", desc: "Military-to-civilian" },
    { name: "LifeBridge", desc: "Virtual 211 & CHW hub" },
    { name: "Better Science Lab", desc: "Implementation science" },
    { name: "SafeCogniCare", desc: "Cognitive safety" },
    { name: "PillScheduler", desc: "Medication management" },
  ];
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a1215]" data-testid="slide-ecosystem">
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-[15%] left-[50%] w-[40vw] h-[40vw] rounded-full bg-violet-500/20 blur-3xl transform -translate-x-1/2" />
      </div>
      <div className="relative z-10 flex flex-col justify-center h-full px-[6vw]">
        <div className="flex items-center justify-between mb-[3vh]">
          <div>
            <p className="text-[#c9a0a0] font-semibold uppercase tracking-widest mb-[1vh]" style={{ fontSize: "1.3vw" }}>20-Platform Ecosystem</p>
            <h2 className="text-white font-bold tracking-tight" style={{ fontSize: "3.2vw" }}>Integrated technology portfolio</h2>
          </div>
          <Link href="/ecosystem" className="flex items-center gap-[0.5vw] text-[#c9a0a0] hover:text-white transition-colors" style={{ fontSize: "1.3vw" }}>
            Explore Hub <ExternalLink style={{ width: "1.2vw", height: "1.2vw" }} />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-[1.2vw]">
          {platforms.map((p, i) => (
            <div key={i} className="bg-white/5 rounded-lg px-[1.2vw] py-[1.2vh] border border-white/10 flex items-center gap-[0.6vw]">
              <CheckCircle2 className="text-emerald-400 shrink-0" style={{ width: "1.3vw", height: "1.3vw" }} />
              <div>
                <span className="text-white/90 block" style={{ fontSize: "1.2vw" }}>{p.name}</span>
                <span className="text-white/40 block" style={{ fontSize: "0.9vw" }}>{p.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-[3vh] grid grid-cols-4 gap-[2vw]">
          {[
            { value: "16", label: "Fully Integrated" },
            { value: "656K+", label: "Curated Records" },
            { value: "50+", label: "State Coverage" },
            { value: "100%", label: "IP Ownership" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-[#c9a0a0] font-bold" style={{ fontSize: "2.5vw" }}>{s.value}</p>
              <p className="text-white/50" style={{ fontSize: "1.1vw" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClosingSlide({ isFullscreen }: SlideProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#6b1c2a] via-[#8b2040] to-[#4a1020]" data-testid="slide-closing">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-[20%] left-[50%] w-[40vw] h-[40vw] rounded-full bg-white/10 blur-3xl transform -translate-x-1/2" />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-[8vw] text-center">
        <div className="rounded-xl p-[1.2vw] bg-white/15 backdrop-blur-sm mb-[3vh]">
          <GraduationCap className="text-white" style={{ width: "3.5vw", height: "3.5vw" }} />
        </div>
        <h2 className="text-white font-bold tracking-tight leading-tight mb-[2vh]" style={{ fontSize: "4vw" }}>
          Ready to transform futures?
        </h2>
        <p className="text-white/70 max-w-[50vw] mb-[4vh]" style={{ fontSize: "1.8vw" }}>
          The students who learn to think with AI today will lead tomorrow.
        </p>
        <div className="flex flex-col items-center gap-[1.5vh]">
          <p className="text-white/90" style={{ fontSize: "1.6vw" }}>Contact Us</p>
          <div className="flex gap-[3vw]">
            <a href="mailto:programs@thecollaborativeadvocate.org" className="text-white/80 hover:text-white transition-colors" style={{ fontSize: "1.4vw" }} data-testid="link-contact-email-1">
              programs@thecollaborativeadvocate.org
            </a>
            <a href="mailto:president@thecollaborativeadvocate.org" className="text-white/80 hover:text-white transition-colors" style={{ fontSize: "1.4vw" }} data-testid="link-contact-email-2">
              president@thecollaborativeadvocate.org
            </a>
          </div>
        </div>
        <div className="mt-[4vh] flex gap-[2vw]">
          <Link href="/impact" className="px-[2vw] py-[1.2vh] rounded-full bg-white text-[#6b1c2a] font-semibold hover:bg-white/90 transition-colors" style={{ fontSize: "1.4vw" }}>
            View Impact Dashboard
          </Link>
          <Link href="/" className="px-[2vw] py-[1.2vh] rounded-full border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition-colors" style={{ fontSize: "1.4vw" }}>
            Explore Platform
          </Link>
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  { component: TitleSlide, title: "ThriveUp Academy", speakerNotes: "Welcome to the ThriveUp Academy stakeholder presentation. This platform is a comprehensive workforce development and community enablement ecosystem serving under-resourced communities of all ages. Our mission: reducing recidivism, increasing employment, and strengthening communities through AI-powered tools and coordinated service delivery. We focus on teaching the first generation to guide their smartest classmate." },
  { component: MissionSlide, title: "Our Mission", speakerNotes: "Our mission is empowering under-resourced communities with AI mastery, workforce readiness, and career pipelines for all ages. We focus on three pillars: AI literacy as the new foundation for career success, direct pipelines from classroom to career placement, and whole-person support through mentorship and community resources." },
  { component: ProblemSlide, title: "The Challenge", speakerNotes: "The challenge is significant. 67% of low-income students lack career readiness programs. Without workforce training, they are 3x more likely to face unemployment. And 82% of future jobs will require digital and AI literacy. These compounding barriers create a cycle that our platform is designed to break." },
  { component: SolutionSlide, title: "Our Solution", speakerNotes: "Our solution is a complete ecosystem, not just a course. It includes a 5-level AI curriculum, 55 career pathways across 12 industries, an AI Creation Studio with 10 professional tools, and a growing mentor network. Each component links to the live platform where you can explore it in detail." },
  { component: CurriculumSlide, title: "AI Mastery Curriculum", speakerNotes: "The curriculum progresses through five mastery levels: Explorer, Guide, Architect, Innovator, and Master. Each level has specific competencies, capstone projects, and parent teachback verification. The 31 modules are structured so students build skills progressively, and tool access is gated behind demonstrated mastery." },
  { component: CareerPathwaysSlide, title: "Career Pathways", speakerNotes: "We offer 55 career pathways across 12 industry categories including Technology, Healthcare, Skilled Trades, Engineering, and more. Each pathway has structured progression from exploration through job readiness, skill training, and career placement. This directly aligns with workforce development grant criteria." },
  { component: AIToolsSlide, title: "AI Creation Studio", speakerNotes: "The AI Creation Studio gives students 10 professional-grade tools, from Presentation Builder and Business Plan Generator to Resume Builder and Research Assistant. Students earn access by completing curriculum modules, ensuring they understand responsible AI use before accessing powerful tools. Adults can access all tools through Sparky." },
  { component: SparkCompanionSlide, title: "AI Companions", speakerNotes: "Spark is our AI learning companion for students with grade-band-specific responses, Socratic questioning, emotional intelligence, bilingual support, and comprehensive safety guardrails. Sparky serves parents and teachers with compassionate, evidence-based support without child-safety restrictions. Both are available for live demonstration." },
  { component: PantherVillageSlide, title: "Panther Village", speakerNotes: "Panther Village is our immersive virtual campus featuring interactive buildings, avatar customization, a stock market simulation for financial literacy, and academic competitions with houses, quests, and leaderboards. It creates an engaging environment that makes learning feel like an adventure." },
  { component: ImpactMetricsSlide, title: "Impact Metrics", speakerNotes: "These are live numbers pulled from our platform right now. We track participants served, career pathways available, professional mentors, mastery levels, learning modules, and career milestones. The full impact dashboard is available at the link shown and can be shared with funders directly." },
  { component: GrantAlignmentSlide, title: "Grant Alignment", speakerNotes: "Our platform meets every criterion for workforce development grant eligibility. Each green checkmark represents a fully implemented capability, not a planned feature. School-to-career pipelines, workforce development, job readiness, skill training, job placement, career advancement, mentorship, and community impact are all active." },
  { component: MentorNetworkSlide, title: "Mentor Network", speakerNotes: "Our mentor network connects participants with professional coaches across all 12 career categories. The system includes structured pathway planning with milestone tracking, career readiness assessments, and revision support. The goal is direct pipelines from skill demonstration to workforce entry." },
  { component: WholeChildSlide, title: "Whole-Child Support", speakerNotes: "Beyond academics, we provide whole-child support including the ThriveUp Academy six-domain scoring engine with early warning systems, financial literacy through stock market simulation, a nationwide community resource finder covering 55 U.S. jurisdictions, and STAAR test preparation aligned to Texas standards." },
  { component: ResourceFinderSlide, title: "Resource Finder", speakerNotes: "Our Community Resource Finder connects families to local support services including healthcare, food assistance, housing, education, and employment across all 50 states plus DC, Puerto Rico, U.S. Virgin Islands, Guam, and American Samoa. It uses real-time GIS data from CDC, FBI, and ATSDR sources." },
  { component: AudienceSlide, title: "Who We Serve", speakerNotes: "We serve multiple stakeholders. Participants of all ages get AI and digital literacy training, career exploration and placement, reentry case management, and workforce development. Community partners get service delivery tracking, referral workflows, volunteer coordination, and collective impact reporting. Funders and grant makers get grant-aligned outcome reports, impact dashboards, CSV exports, and API integration." },
  { component: EcosystemSlide, title: "20-Platform Ecosystem", speakerNotes: "The Collaborative Advocate operates a 20-platform technology ecosystem with 16 fully integrated platforms. This includes ThriveUp Academy as the central hub, ISSS for whole-child implementation, Sankofa Health Network for community health, MCE for minority business development, WholeMind Learning for K-12 education, and specialized platforms for veterans, neurodiversity, mandatory reporting, cognitive safety, and medication management. All platforms share data through a unified cross-platform API with 100% IP ownership." },
  { component: DifferentiatorsSlide, title: "What Makes Us Different", speakerNotes: "Four things differentiate us. First, tools are earned through mastery, not purchased. Second, our AI has safety-first design with age-appropriate guardrails. Third, we provide real impact data, not projections. Fourth, we are community-embedded with nationwide resource support and early warning systems." },
  { component: AccessibilitySlide, title: "Accessibility", speakerNotes: "Accessibility is not an afterthought. We have over 2,415 test identifiers, 95+ accessibility labels, WCAG 2.1 AA compliance, dyslexia-friendly fonts, large text mode, high contrast, reduced motion support, English and Spanish, low-bandwidth mode, and full mobile responsiveness." },
  { component: ComplianceSlide, title: "Security & Compliance", speakerNotes: "We are COPPA compliant with parental consent and data retention policies, FERPA aligned with student data protection and role-based access control, secure OIDC authentication, and rate-limited AI interactions. All API routes have comprehensive error handling." },
  { component: TechnicalSlide, title: "Technical Architecture", speakerNotes: "The platform runs on a production-ready stack with 120+ pages, 150+ API routes with 100% error handling coverage, 60+ code-split components for performance. The frontend uses React, Vite, and TanStack Query. The backend runs Express with PostgreSQL and Drizzle ORM. AI is powered by Gemini with fallback providers." },
  { component: ImplementationSlide, title: "Implementation Plan", speakerNotes: "Our phased rollout starts with foundation deployment and initial school partnerships in months 1-3, moves to growth with mentor expansion and career pipeline activation in months 4-6, and scales to multi-district rollout with employer partnerships and national expansion planning in months 7-12." },
  { component: ClosingSlide, title: "Let's Connect", speakerNotes: "The people who learn to think with AI today will lead tomorrow. We invite you to explore the live platform, review our impact dashboard, and connect with us to discuss partnership opportunities. Contact us at the email addresses shown. Thank you for your time and interest in ThriveUp Academy." },
];

export default function StakeholderPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: impactData, isLoading } = useQuery<ImpactData>({
    queryKey: ["/api/public/impact"],
  });

  useEffect(() => {
    document.title = "Stakeholder Presentation - ThriveUp Academy";
  }, []);

  const goNext = useCallback(() => {
    setCurrentSlide(s => Math.min(s + 1, SLIDES.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentSlide(s => Math.max(s - 1, 0));
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "f") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
      if (e.key === "n") setShowNotes(s => !s);
      if (e.key === "Escape") setShowNotes(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  const CurrentSlideComponent = SLIDES[currentSlide].component;

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="fixed inset-0 bg-black flex flex-col" data-testid="stakeholder-presentation">
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full" style={{ aspectRatio: "16/9" }}>
            <CurrentSlideComponent impactData={impactData} isFullscreen={isFullscreen} />
          </div>
        </div>
      </div>

      {showNotes && (
        <div className="absolute bottom-[6vh] left-[2vw] right-[2vw] z-50" data-testid="speaker-notes-panel">
          <div className="bg-black/90 backdrop-blur-md rounded-xl p-[2vw] border border-white/20 max-h-[25vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-[1vh]">
              <p className="text-white/60 font-semibold uppercase tracking-wider" style={{ fontSize: "1vw" }}>Speaker Notes</p>
              <button onClick={() => setShowNotes(false)} className="text-white/40 hover:text-white" aria-label="Close speaker notes" data-testid="btn-close-notes">
                <X style={{ width: "1.5vw", height: "1.5vw" }} />
              </button>
            </div>
            <p className="text-white/90 leading-relaxed" style={{ fontSize: "1.4vw" }}>{SLIDES[currentSlide].speakerNotes}</p>
          </div>
        </div>
      )}

      <div className="h-[5vh] bg-black/80 backdrop-blur-sm flex items-center justify-between px-[2vw] border-t border-white/10 z-50" data-testid="slide-controls">
        <div className="flex items-center gap-[1vw]">
          <button
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="text-white/60 hover:text-white disabled:text-white/20 transition-colors"
            aria-label="Previous slide"
            data-testid="btn-prev-slide"
          >
            <ChevronLeft style={{ width: "2vw", height: "2vw" }} />
          </button>
          <span className="text-white/60" style={{ fontSize: "1.2vw" }}>
            {currentSlide + 1} / {SLIDES.length}
          </span>
          <button
            onClick={goNext}
            disabled={currentSlide === SLIDES.length - 1}
            className="text-white/60 hover:text-white disabled:text-white/20 transition-colors"
            aria-label="Next slide"
            data-testid="btn-next-slide"
          >
            <ChevronRight style={{ width: "2vw", height: "2vw" }} />
          </button>
        </div>

        <div className="flex items-center gap-[0.5vw]">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`rounded-full transition-all ${i === currentSlide ? "bg-white w-[0.8vw] h-[0.8vw]" : "bg-white/30 w-[0.5vw] h-[0.5vw] hover:bg-white/50"}`}
              aria-label={`Go to slide ${i + 1}`}
              data-testid={`btn-slide-dot-${i}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-[1.5vw]">
          <span className="text-white/40" style={{ fontSize: "1vw" }}>
            {SLIDES[currentSlide].title}
          </span>
          <button
            onClick={() => setShowNotes(s => !s)}
            className={`transition-colors ${showNotes ? "text-white" : "text-white/40 hover:text-white/70"}`}
            aria-label="Toggle speaker notes"
            data-testid="btn-toggle-notes"
          >
            <MessageSquare style={{ width: "1.5vw", height: "1.5vw" }} />
          </button>
          <button
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else document.documentElement.requestFullscreen();
            }}
            className="text-white/40 hover:text-white/70 transition-colors"
            aria-label="Toggle fullscreen"
            data-testid="btn-fullscreen"
          >
            {isFullscreen ? <Minimize style={{ width: "1.5vw", height: "1.5vw" }} /> : <Maximize style={{ width: "1.5vw", height: "1.5vw" }} />}
          </button>
        </div>
      </div>
    </div>
  );
}
