import { useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Compass, Map, Building2, Lightbulb, Crown,
  BookOpen, Users, Award, Brain, Sparkles,
  ArrowRight, ChevronRight, Shield, Target, Zap,
  Heart, Calculator, Microscope, Globe, Salad,
  GraduationCap, MapPin, Languages, Laptop, Mail,
  Play, Pause, Volume2, VolumeX, Maximize
} from "lucide-react";
import { LEVEL_COLORS } from "@/lib/curriculum-data";
import featureVideoSrc from "@assets/Learning_Academy_1.0_1772131808280.mp4";

const levelIcons = [Compass, Map, Building2, Lightbulb, Crown];

const levels = [
  { id: 1, title: "AI Explorer", grades: "3-5", desc: "Discovery & basics" },
  { id: 2, title: "AI Guide", grades: "3-5", desc: "Prompting & creative applications" },
  { id: 3, title: "AI Architect", grades: "6-8", desc: "Building & ethics deepening" },
  { id: 4, title: "AI Innovator", grades: "9-10", desc: "Advanced creation & societal impact" },
  { id: 5, title: "AI Master", grades: "11-12", desc: "Leadership & teaching others" },
];

const subjectAreas = [
  { name: "ELA", icon: BookOpen, color: "from-rose-500 to-pink-600", desc: "Reading, writing, and language arts across all grade levels" },
  { name: "Mathematics", icon: Calculator, color: "from-blue-500 to-indigo-600", desc: "Number sense, problem solving, and mathematical thinking" },
  { name: "Science", icon: Microscope, color: "from-emerald-500 to-teal-600", desc: "Observation, experiments, and understanding our world" },
  { name: "Social Studies", icon: Globe, color: "from-amber-500 to-orange-600", desc: "Community, history, geography, and civic understanding" },
  { name: "Social-Emotional Learning", icon: Heart, color: "from-pink-500 to-rose-600", desc: "Self-awareness, empathy, kindness, and healthy relationships" },
  { name: "Wellness & Self-Care", icon: Salad, color: "from-teal-500 to-cyan-600", desc: "Physical health, mindfulness, nutrition, and personal growth" },
];

const features = [
  {
    icon: Heart,
    title: "Whole-Child Approach",
    desc: "We nurture every dimension of your child's growth - academic, emotional, social, and physical.",
  },
  {
    icon: Shield,
    title: "Safe & Empathetic",
    desc: "Content designed with deep empathy - like having a caring teacher who truly understands each child.",
  },
  {
    icon: Target,
    title: "Age-Appropriate",
    desc: "From 3rd through 12th grade, every lesson meets children exactly where they are developmentally.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Learning",
    desc: "Spark, our AI learning companion, provides safe, ethical guidance that promotes thinking - never just answers.",
  },
  {
    icon: Users,
    title: "Family Learning",
    desc: "Children teach parents through structured teachback sessions, strengthening bonds and understanding.",
  },
  {
    icon: Zap,
    title: "Interactive & Engaging",
    desc: "Matching games, sorting activities, breathing exercises, and hands-on activities that make learning joyful.",
  },
];

function FeatureVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      setShowOverlay(false);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowOverlay(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      togglePlay();
    }
  };

  return (
    <Card className="overflow-hidden shadow-xl border-2 border-primary/10" data-testid="card-feature-video">
      <div className="relative group">
        <video
          ref={videoRef}
          src={featureVideoSrc}
          className="w-full aspect-video bg-black"
          aria-label="Learning Academy platform tour with Arthur Wakanda"
          onEnded={() => { setIsPlaying(false); setShowOverlay(true); }}
          onClick={togglePlay}
          playsInline
          data-testid="video-feature-guide"
        />

        {showOverlay && !isPlaying && (
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 flex flex-col items-center justify-center cursor-pointer"
            onClick={togglePlay}
            onKeyDown={handleOverlayKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Play platform tour video"
            data-testid="overlay-video-play"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/90 flex items-center justify-center shadow-2xl mb-4 transition-transform hover:scale-110">
              <Play className="h-10 w-10 md:h-12 md:w-12 text-violet-700 ml-1" />
            </div>
            <p className="text-white text-lg md:text-xl font-semibold" data-testid="text-video-title">Watch the Platform Tour</p>
            <p className="text-white/70 text-sm mt-1" data-testid="text-video-subtitle">7 minutes with Arthur Wakanda</p>
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between transition-opacity ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/20" onClick={togglePlay} aria-label={isPlaying ? "Pause video" : "Play video"} data-testid="button-video-playpause">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/20" onClick={toggleMute} aria-label={isMuted ? "Unmute video" : "Mute video"} data-testid="button-video-mute">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/20" onClick={toggleFullscreen} aria-label="Toggle fullscreen" data-testid="button-video-fullscreen">
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-6 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-6 bg-white/15 text-white border-white/20">
            Grades 3-12 Whole-Child Learning Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Learning<br />Academy
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-4">
            Nurturing the whole child through empathetic, age-appropriate education
          </p>
          <p className="text-sm md:text-base text-white/60 max-w-xl mx-auto mb-10">
            Six core subjects, AI-powered guidance, and interactive activities designed by education specialists who think like caring teachers, counselors, and parents.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/subjects">
              <Button size="lg" className="bg-white text-violet-700 border-white/80" data-testid="button-explore-subjects">
                <GraduationCap className="mr-2 h-5 w-5" />
                Explore Subjects
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10" data-testid="button-start-learning">
                Start Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Video Guide */}
      <section className="py-20 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <Play className="mr-1 h-3 w-3" /> Platform Tour
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-video-heading">
              See Learning Academy in Action
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Join Arthur Wakanda on a 7-minute tour of the platform -- from Youth AI Learning to career pathways, Panther Village, and beyond.
            </p>
          </div>
          <FeatureVideoPlayer />
        </div>
      </section>

      {/* Features / Philosophy */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-philosophy-heading">
              Designed for Every Child to Thrive
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Built with empathy at every level - like having a caring teacher, counselor, and champion all in one.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 hover-elevate">
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid={`text-feature-${feature.title.toLowerCase().replace(/\s/g, '-')}`}>
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subject Areas */}
      <section className="py-20 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <Heart className="mr-1 h-3 w-3" /> 6 Core Subject Areas
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-subjects-heading">
              Supporting the Whole Child
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From reading and math to emotional wellness and self-care - every part of your child's growth matters.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectAreas.map((subject) => (
              <Link key={subject.name} href="/subjects">
                <Card className="p-5 hover-elevate cursor-pointer group h-full" data-testid={`card-subject-${subject.name.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className="flex items-start gap-4">
                    <div className={`rounded-md p-2.5 bg-gradient-to-br ${subject.color} shrink-0`}>
                      <subject.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{subject.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Curriculum Levels */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <Brain className="mr-1 h-3 w-3" /> AI Mastery Track
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-levels-heading">
              From Explorer to Master
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              A dedicated AI curriculum teaching responsible, ethical use of artificial intelligence across grades 3-12.
            </p>
          </div>
          <div className="space-y-3">
            {levels.map((level, i) => {
              const Icon = levelIcons[i];
              const colors = LEVEL_COLORS[level.id];
              return (
                <Link key={level.id} href={`/curriculum/${level.id}`}>
                  <Card className="p-5 hover-elevate cursor-pointer group" data-testid={`card-level-${level.id}`}>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className={`rounded-md p-2.5 bg-gradient-to-br ${colors.gradient} shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">Level {level.id}: {level.title}</h3>
                          <Badge variant="outline" className="text-xs">{level.grades}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{level.desc}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Spark AI Companion CTA */}
      <section className="py-20 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-violet-600 to-indigo-700 border-none text-white">
            <div className="text-center">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-white/80" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Meet Spark, Your Learning Companion</h2>
              <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-6">
                Spark is an AI-powered buddy who helps students learn by asking great questions, giving gentle hints, and celebrating every step forward. Spark never gives answers directly - instead, Spark helps children think for themselves.
              </p>
              <Link href="/ai-companion">
                <Button size="lg" className="bg-white text-violet-700 border-white/80" data-testid="button-meet-spark">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Chat with Spark
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Austin Community Access */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <MapPin className="mr-1 h-3 w-3" /> Launching in Austin, TX
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-austin-heading">
              Equity-First, Community-Driven
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Austin is our launching city. We're building partnerships to ensure every family has access - regardless of income, language, or technology.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Heart, title: "Free Access", desc: "Subsidized and free access for qualifying Austin families and Title I school partnerships" },
              { icon: Laptop, title: "Device Lending", desc: "Chromebook and tablet lending through community centers for families without devices" },
              { icon: Languages, title: "En Español", desc: "Full Spanish language support with culturally relevant content for Austin's families" },
            ].map((item) => (
              <Card key={item.title} className="p-5 hover-elevate" data-testid={`card-austin-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/community">
              <Button variant="outline" data-testid="button-view-community">
                View All Community Programs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "6", label: "Subject Areas" },
              { value: "3-12", label: "Grade Range" },
              { value: "5", label: "AI Mastery Levels" },
              { value: "100+", label: "Activities" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-bold text-primary" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold">Learning Academy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Supporting the whole child - because every part of growing up matters.
          </p>
          <a href="mailto:sisnett.meredith@gmail.com" className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="link-support-email">
            <Mail className="h-3.5 w-3.5" /> sisnett.meredith@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
