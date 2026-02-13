import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Building2, Laptop, WifiOff, Languages, GraduationCap,
  ArrowRight, MapPin, Globe, Heart, CheckCircle2, Mail
} from "lucide-react";

const programs = [
  {
    id: "free-access",
    title: "Free & Subsidized Access",
    icon: DollarSign,
    gradient: "from-emerald-500 to-teal-600",
    description: "Free platform access for qualifying Austin families with income-based support to ensure every child can learn.",
    features: [
      "Free access for families at or below 200% federal poverty level",
      "Income-based sliding scale for partial subsidies",
      "Automatic qualification with FRL (Free and Reduced Lunch) status",
      "Simple online application with 48-hour approval",
    ],
  },
  {
    id: "title-i-schools",
    title: "Title I School Partnerships",
    icon: Building2,
    gradient: "from-blue-500 to-indigo-600",
    description: "Direct partnerships with Austin ISD Title I schools providing seamless access for students and teachers.",
    features: [
      "School-provided access codes for all enrolled students",
      "Teacher dashboards for tracking student progress",
      "Integration with existing school curriculum and standards",
      "Dedicated support line for school administrators",
    ],
  },
  {
    id: "device-lending",
    title: "Device Lending Program",
    icon: Laptop,
    gradient: "from-violet-500 to-purple-600",
    description: "Chromebook and tablet lending library available through community centers and partner schools across Austin.",
    features: [
      "Request a device online or at any partner location",
      "Pickup and return at 12+ community centers citywide",
      "No-cost device insurance included with every loan",
      "Tech support and device care guides provided",
    ],
  },
  {
    id: "offline-mode",
    title: "Offline & Low-Bandwidth Mode",
    icon: WifiOff,
    gradient: "from-amber-500 to-orange-600",
    description: "Downloadable lesson packs and data-saving features so learning never stops, even without reliable internet.",
    features: [
      "Download full lesson packs for offline use anytime",
      "Low-bandwidth mode strips heavy images and animations",
      "Data-saver mode caches content for minimal data usage",
      "Enable in Settings > Accessibility > Connection Mode",
    ],
  },
  {
    id: "spanish-support",
    title: "Spanish Language Support",
    icon: Languages,
    gradient: "from-rose-500 to-pink-600",
    description: "Full platform experience available in Spanish with culturally relevant content for Austin's bilingual families.",
    features: [
      "Complete platform interface and lessons in Spanish",
      "Culturally relevant examples and story contexts",
      "Bilingual parent guides and resource documents",
      "Toggle language anytime via the profile menu",
    ],
  },
  {
    id: "parent-literacy",
    title: "Parent Digital Literacy",
    icon: GraduationCap,
    gradient: "from-teal-500 to-cyan-600",
    description: "Free workshops and support to help parents confidently guide their children's digital learning journey.",
    features: [
      "Free in-person workshops at Austin community centers",
      "Online video tutorials available on-demand",
      "One-on-one tech support sessions by appointment",
      "Dedicated parent resources page with guides and FAQs",
    ],
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 px-6 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-6 bg-white/15 text-white border-white/20" data-testid="badge-launching-city">
            <MapPin className="mr-1 h-3 w-3" /> Austin, TX - Launching City
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight" data-testid="text-community-heading">
            Community Access<br />Programs
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-4">
            Austin is the first city to launch Learning Academy's equity programs, ensuring every family has access to world-class education.
          </p>
          <p className="text-sm md:text-base text-white/60 max-w-xl mx-auto mb-10">
            Six dedicated programs removing barriers to learning — from free access and device lending to offline support and bilingual resources.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-violet-700 border-white/80" data-testid="button-hero-apply">
              <DollarSign className="mr-2 h-5 w-5" />
              Apply for Free Access
            </Button>
            <Link href="/">
              <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10" data-testid="button-hero-learn-more">
                Learn About the Academy
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">
              <Heart className="mr-1 h-3 w-3" /> 6 Equity Programs
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-programs-heading">
              Removing Every Barrier to Learning
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From financial assistance to language support, these programs ensure no child in Austin is left behind.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <Card key={program.id} className="p-6 h-full" data-testid={`card-program-${program.id}`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`rounded-md p-2.5 bg-gradient-to-br ${program.gradient} shrink-0`}>
                    <program.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1" data-testid={`text-program-title-${program.id}`}>
                      {program.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{program.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-1">
                  {program.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">
              <Globe className="mr-1 h-3 w-3" /> Coming Soon
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-expanding-heading">
              Expanding Nationwide
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Austin is our pilot city — the proving ground for a model designed to scale. Every lesson learned here shapes how we bring equitable access to families in cities across the country. Our goal is to launch in 10 additional cities by 2027, adapting each program to local community needs while maintaining the quality and care that define Learning Academy.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mt-12">
            {[
              { value: "1", label: "Pilot City" },
              { value: "6", label: "Equity Programs" },
              { value: "10+", label: "Cities by 2027" },
              { value: "100%", label: "Free for Qualifying Families" },
            ].map((stat) => (
              <div key={stat.label} data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-violet-600 to-indigo-700 border-none text-white">
            <div className="text-center">
              <Heart className="h-10 w-10 mx-auto mb-4 text-white/80" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="text-cta-heading">
                Get Started Today
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-8">
                Whether you're a parent seeking free access for your child or a school administrator looking to bring Learning Academy to your campus, we're here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-white text-violet-700 border-white/80" data-testid="button-apply-free-access">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Apply for Free Access
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10" data-testid="button-school-admin-info">
                  <Building2 className="mr-2 h-5 w-5" />
                  School Administrator Info
                </Button>
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
            Equity in education — because every child deserves access.
          </p>
          <a href="mailto:mr.terryflood@gmail.com" className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="link-support-email">
            <Mail className="h-3.5 w-3.5" /> mr.terryflood@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
