import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone, Shield, Heart, Eye, Users, BookOpen, Brain,
  Fingerprint, AlertTriangle, Clock, Sparkles, ArrowRight,
  MonitorSmartphone, MessageSquare, Lock, UserCheck,
  CheckCircle2, Search, Scale
} from "lucide-react";

const studentModules = [
  {
    id: "digital-footprint",
    icon: Fingerprint,
    title: "Your Digital Footprint",
    grades: "All Grades",
    description: "Everything you share online tells a story about who you are. Learn how to make sure it's a story you're proud of.",
    topics: [
      "What you share online stays online forever",
      "Building a positive digital identity",
      'Thinking before you post: the "billboard test"',
      "Understanding privacy settings and what they really mean",
    ],
  },
  {
    id: "spotting-tricks",
    icon: Shield,
    title: "Spotting Tricks & Staying Safe",
    grades: "All Grades",
    description: "The internet is full of amazing people and ideas, but not everything is what it seems. Learn how to stay smart and safe.",
    topics: [
      "How to recognize misinformation and fake accounts",
      "What to do if someone makes you uncomfortable online",
      "Cyberbullying: recognizing it, stopping it, and getting help",
      "The difference between online friends and real-life friends",
    ],
  },
  {
    id: "healthy-habits",
    icon: Heart,
    title: "Building Healthy Social Media Habits",
    grades: "All Grades",
    description: "Social media can be a great tool when you use it wisely. Learn how to stay balanced and use it for good.",
    topics: [
      "Screen time balance: knowing when to log off",
      "How social media is designed to keep you scrolling (algorithms, notifications)",
      "Comparing yourself to others: filters, highlight reels, and reality",
      "Using social media as a positive tool for learning and creativity",
    ],
  },
];

const parentModules = [
  {
    id: "digital-world",
    icon: MonitorSmartphone,
    title: "Understanding Your Child's Digital World",
    description: "Get a clear picture of the platforms your child uses, why they love them, and what to watch for at every age.",
    topics: [
      "What platforms kids actually use and how they work",
      "The appeal: why kids love social media",
      "Age-appropriate expectations by grade band (3-5, 6-8, 9-12)",
      "Warning signs that something isn't right",
    ],
  },
  {
    id: "setting-boundaries",
    icon: Lock,
    title: "Setting Boundaries That Actually Work",
    description: "Practical strategies for creating rules your family can live with, plus tools that genuinely help.",
    topics: [
      "Parental controls: what's available and what actually helps",
      "Having open conversations about online experiences",
      "Family media agreements that kids will actually follow",
      "Privacy settings walkthrough for popular platforms",
    ],
  },
  {
    id: "digital-role-model",
    icon: UserCheck,
    title: "Being a Digital Role Model",
    description: "Your own relationship with technology shapes your child's habits more than you might think.",
    topics: [
      "How your own social media use affects your kids",
      "Sharing photos of your children: risks and considerations",
      "Building a family culture of thoughtful technology use",
      "Resources for ongoing learning and community support",
    ],
  },
];

export default function SocialMediaLiteracyPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 px-6 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-6 bg-white/15 text-white border-white/20" data-testid="badge-social-media-literacy">
            <Smartphone className="mr-1 h-3 w-3" /> Social Media Literacy
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight" data-testid="text-hero-title">
            Social Media<br />Literacy
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-4">
            Teaching social media the way we teach AI — with curiosity, critical thinking, and care.
          </p>
          <p className="text-sm md:text-base text-white/60 max-w-xl mx-auto mb-10">
            Three focused modules for students and three for parents, building the skills every family needs to navigate social media thoughtfully.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#students">
              <Button size="lg" className="bg-white text-teal-700 border-white/80" data-testid="button-explore-student-modules">
                <BookOpen className="mr-2 h-5 w-5" />
                Student Modules
              </Button>
            </Link>
            <Link href="#parents">
              <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10" data-testid="button-explore-parent-modules">
                Parent Modules
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="students" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="mr-1 h-3 w-3" /> For Students
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-students-heading">
              For Students
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three modules designed to help kids in grades 3-12 understand, question, and take control of their social media experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentModules.map((mod) => (
              <Card key={mod.id} className="p-6 hover-elevate" data-testid={`card-student-module-${mod.id}`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                      <mod.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" data-testid={`badge-grades-${mod.id}`}>
                      {mod.grades}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid={`text-student-module-${mod.id}`}>
                      {mod.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{mod.description}</p>
                  </div>
                  <ul className="space-y-2">
                    {mod.topics.map((topic, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="parents" className="py-20 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <Users className="mr-1 h-3 w-3" /> For Parents & Guardians
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-parents-heading">
              For Parents & Guardians
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three modules to help you understand your child's online world, set meaningful boundaries, and lead by example.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parentModules.map((mod) => (
              <Card key={mod.id} className="p-6 hover-elevate" data-testid={`card-parent-module-${mod.id}`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                      <mod.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid={`text-parent-module-${mod.id}`}>
                      {mod.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{mod.description}</p>
                  </div>
                  <ul className="space-y-2">
                    {mod.topics.map((topic, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-cyan-600 to-teal-700 border-none text-white">
            <div className="text-center">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-white/80" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="text-cta-heading">
                Part of a Bigger Picture
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-8">
                Social media literacy is one piece of the digital skills puzzle. Explore our full AI curriculum to see how students learn to think critically about all kinds of technology — with Spark, their AI learning companion, guiding the way.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/curriculum">
                  <Button size="lg" className="bg-white text-teal-700 border-white/80" data-testid="button-explore-curriculum">
                    <Brain className="mr-2 h-5 w-5" />
                    Explore AI Curriculum
                  </Button>
                </Link>
                <Link href="/ai-companion">
                  <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10" data-testid="button-meet-spark">
                    Meet Spark
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer className="py-10 px-6 border-t">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold">Learning Academy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Teaching digital citizenship — because every child deserves to feel safe online.
          </p>
        </div>
      </footer>
    </div>
  );
}
