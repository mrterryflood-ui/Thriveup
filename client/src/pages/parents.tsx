import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, BookOpen, Shield, Brain, Wifi, Heart,
  MonitorSmartphone, MessageSquare, BarChart3,
  Video, FileText, Phone, MessagesSquare,
  Calendar, MapPin, Clock, ArrowRight, Sparkles, Mail
} from "lucide-react";

const whyItMatters = [
  {
    icon: Users,
    title: "Learn Together",
    desc: "Parents and children grow digital skills side by side.",
  },
  {
    icon: BookOpen,
    title: "Stay Informed",
    desc: "Understand what your child is learning and how AI tools work.",
  },
  {
    icon: Sparkles,
    title: "Build Confidence",
    desc: "Gain skills to navigate the digital world alongside your child.",
  },
];

const trainingModules = [
  {
    icon: MonitorSmartphone,
    title: "Getting Started with Learning Academy",
    difficulty: "Beginner",
    desc: "Navigating the platform, setting up profiles, understanding progress tracking.",
  },
  {
    icon: Brain,
    title: "Understanding AI in Education",
    difficulty: "Beginner",
    desc: "What AI is, how Spark works, why it's safe for children.",
  },
  {
    icon: Shield,
    title: "Internet Safety for Families",
    difficulty: "Beginner",
    desc: "Online safety basics, privacy, screen time management.",
  },
  {
    icon: BarChart3,
    title: "Supporting Your Child's Learning",
    difficulty: "Intermediate",
    desc: "Using progress reports, identifying struggles, encouraging growth mindset.",
  },
  {
    icon: MessageSquare,
    title: "Digital Communication Skills",
    difficulty: "Intermediate",
    desc: "Email, messaging, and digital etiquette for families.",
  },
  {
    icon: Wifi,
    title: "Advanced Platform Features",
    difficulty: "Intermediate",
    desc: "Understanding analytics, setting goals, using offline mode.",
  },
];

const workshopSchedule = [
  {
    icon: Calendar,
    text: "Every Saturday, 10am-12pm at Austin Central Library",
  },
  {
    icon: MapPin,
    text: "Tuesday evenings, 6pm-8pm at various Austin Community Centers",
  },
  {
    icon: Clock,
    text: "One-on-one tech support available by appointment",
  },
];

const resources = [
  {
    icon: Video,
    title: "Video Tutorials",
    desc: "Step-by-step guides available in English and Spanish.",
  },
  {
    icon: FileText,
    title: "Printed Guides",
    desc: "Downloadable PDF guides for offline reference.",
  },
  {
    icon: Phone,
    title: "Help Line",
    desc: "Phone and chat support available in English and Spanish.",
  },
  {
    icon: MessagesSquare,
    title: "Community Forum",
    desc: "Connect with other Austin parents.",
  },
];

export default function ParentResourcesPage() {
  return (
    <div className="min-h-screen">
      {/* Progress Dashboard CTA */}
      <section className="px-6 pt-6">
        <div className="mx-auto max-w-5xl">
          <Link href="/parents/dashboard">
            <Card className="p-6 hover-elevate cursor-pointer border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5" data-testid="card-view-progress-dashboard">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h2 className="text-lg font-bold mb-0.5">View Your Child's Progress</h2>
                  <p className="text-sm text-muted-foreground">Track scores, completion stats, streaks, and personalized recommendations</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-6 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-6 bg-white/15 text-white border-white/20" data-testid="badge-for-parents">
            For Parents & Guardians
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight" data-testid="text-hero-title">
            Parent Resources &<br />Digital Literacy
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-4">
            Empowering parents to support their children's learning journey
          </p>
          <p className="text-sm md:text-base text-white/60 max-w-xl mx-auto mb-10">
            Build your own digital skills while staying connected to what your child is learning. Free training, workshops, and resources for Austin families.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#modules">
              <Button size="lg" className="bg-white text-violet-700 border-white/80" data-testid="button-explore-modules">
                <BookOpen className="mr-2 h-5 w-5" />
                Explore Training
              </Button>
            </Link>
            <Link href="#workshops">
              <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10" data-testid="button-view-workshops">
                View Workshops
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Parent Digital Literacy Matters */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-why-matters-heading">
              Why Parent Digital Literacy Matters
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              When parents learn alongside their children, the whole family benefits.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {whyItMatters.map((item) => (
              <Card key={item.title} className="p-6 hover-elevate" data-testid={`card-why-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid={`text-why-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Training Modules */}
      <section id="modules" className="py-20 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <Brain className="mr-1 h-3 w-3" /> Digital Literacy Training
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-modules-heading">
              Training Modules
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Self-paced courses designed specifically for parents and guardians - no prior tech experience needed.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainingModules.map((mod) => (
              <Card key={mod.title} className="p-6 hover-elevate" data-testid={`card-module-${mod.title.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                      <mod.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge
                      variant={mod.difficulty === "Beginner" ? "secondary" : "outline"}
                      data-testid={`badge-difficulty-${mod.title.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {mod.difficulty}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid={`text-module-${mod.title.toLowerCase().replace(/\s/g, '-')}`}>
                      {mod.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Schedule */}
      <section id="workshops" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <Calendar className="mr-1 h-3 w-3" /> In-Person Workshops
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-workshops-heading">
              Workshop Schedule
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Free in-person workshops at Austin community centers. All skill levels welcome.
            </p>
          </div>
          <Card className="p-8 md:p-10 max-w-2xl mx-auto" data-testid="card-workshop-schedule">
            <div className="space-y-5 mb-8">
              {workshopSchedule.map((item, i) => (
                <div key={i} className="flex items-start gap-4" data-testid={`text-workshop-${i}`}>
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm leading-relaxed pt-1.5">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link href="/community">
                <Button data-testid="button-view-full-schedule">
                  View Full Schedule
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <Heart className="mr-1 h-3 w-3" /> Quick Links
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-resources-heading">
              Resources
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Additional support to help you on your digital literacy journey.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((resource) => (
              <Card key={resource.title} className="p-6 hover-elevate" data-testid={`card-resource-${resource.title.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2.5">
                    <resource.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold" data-testid={`text-resource-${resource.title.toLowerCase().replace(/\s/g, '-')}`}>
                    {resource.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{resource.desc}</p>
                </div>
              </Card>
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
            Supporting the whole family - because learning is better together.
          </p>
          <a href="mailto:mr.terryflood@gmail.com" className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="link-support-email">
            <Mail className="h-3.5 w-3.5" /> mr.terryflood@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
