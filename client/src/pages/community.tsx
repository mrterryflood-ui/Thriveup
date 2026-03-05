import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  DollarSign, Building2, Laptop, WifiOff, Languages, GraduationCap,
  ArrowRight, MapPin, Globe, Heart, CheckCircle2, Mail, Briefcase,
  Users, TrendingUp, Target, Award, BarChart3
} from "lucide-react";

const programs = [
  {
    id: "free-access",
    title: "Free & Subsidized Access",
    icon: DollarSign,
    gradient: "from-emerald-500 to-teal-600",
    description: "Free platform access for under-resourced youth ages 14-24, removing financial barriers to AI mastery and career readiness training.",
    features: [
      "Free access for youth from under-resourced communities",
      "Income-based sliding scale for partial subsidies",
      "Automatic qualification with FRL status or community referral",
      "Simple online application with 48-hour approval",
    ],
  },
  {
    id: "career-pipeline",
    title: "School-to-Career Pipeline",
    icon: Briefcase,
    gradient: "from-blue-500 to-indigo-600",
    description: "Structured workforce development pathways connecting youth to real career opportunities through AI skill training, mentorship, and job placement support.",
    features: [
      "AI-powered career assessments and personalized pathway plans",
      "Industry-recognized skill certifications and micro-credentials",
      "Direct connections to employer partners and internship programs",
      "Job readiness workshops covering resumes, interviews, and workplace skills",
    ],
  },
  {
    id: "title-i-schools",
    title: "Title I School Partnerships",
    icon: Building2,
    gradient: "from-violet-500 to-purple-600",
    description: "Direct partnerships with Title I schools providing seamless access to AI mastery curriculum and workforce development resources for students and teachers.",
    features: [
      "School-provided access codes for all enrolled students ages 14-24",
      "Teacher dashboards for tracking student progress and career readiness",
      "Integration with existing school curriculum and career pathways",
      "Dedicated support line for school administrators",
    ],
  },
  {
    id: "device-lending",
    title: "Device Lending Program",
    icon: Laptop,
    gradient: "from-amber-500 to-orange-600",
    description: "Chromebook and tablet lending library ensuring under-resourced youth have the technology needed for AI skill development and career training.",
    features: [
      "Request a device online or at any partner location",
      "Pickup and return at 12+ community centers citywide",
      "No-cost device insurance included with every loan",
      "Tech support and career readiness software pre-installed",
    ],
  },
  {
    id: "mentorship-network",
    title: "Mentorship & Career Coaching",
    icon: Users,
    gradient: "from-rose-500 to-pink-600",
    description: "Connecting youth with industry professionals and career coaches who provide guidance, skill development, and workforce navigation support.",
    features: [
      "1-on-1 mentorship matching with industry professionals",
      "Career coaching sessions focused on job readiness and advancement",
      "Professional networking events and industry exposure opportunities",
      "Ongoing support through career placement and first-year employment",
    ],
  },
  {
    id: "bilingual-workforce",
    title: "Bilingual Workforce Readiness",
    icon: Languages,
    gradient: "from-teal-500 to-cyan-600",
    description: "Full platform experience in Spanish with culturally relevant career development content for bilingual youth and families.",
    features: [
      "Complete AI mastery curriculum available in Spanish",
      "Bilingual career readiness resources and job preparation materials",
      "Culturally relevant mentorship and career pathway guidance",
      "Parent engagement resources in Spanish for family workforce support",
    ],
  },
];

const impactMetrics = [
  {
    value: "2,500+",
    label: "Youth Served",
    description: "Under-resourced youth ages 14-24 actively engaged",
    icon: Users,
  },
  {
    value: "85%",
    label: "Career Placement Rate",
    description: "Youth placed in jobs, internships, or advanced training",
    icon: Briefcase,
  },
  {
    value: "500+",
    label: "Mentorship Connections",
    description: "Active mentor-youth partnerships in workforce development",
    icon: Heart,
  },
  {
    value: "40+",
    label: "Employer Partners",
    description: "Industry partners providing career pathways and job opportunities",
    icon: Building2,
  },
  {
    value: "12",
    label: "AI Skill Certifications",
    description: "Industry-recognized credentials earned by program participants",
    icon: Award,
  },
  {
    value: "92%",
    label: "Program Retention",
    description: "Youth completing full career pipeline program cycle",
    icon: TrendingUp,
  },
];

export default function CommunityPage() {
  useEffect(() => {
    document.title = "Community Access & Career Pipeline | AI Mastery Academy";
  }, []);

  return (
    <div className="min-h-screen">
      <div className="px-6 pt-6">
        <div className="mx-auto max-w-5xl">
          <PageHeader
            title="Community Access & Career Pipeline"
            description="Programs removing barriers to workforce development for under-resourced youth"
            breadcrumbs={[{label:"Community"}]}
          />
        </div>
      </div>
      <section className="relative overflow-hidden py-20 px-6 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-6 bg-white/15 text-white border-white/20" data-testid="badge-launching-city">
            <Target className="mr-1 h-3 w-3" /> Workforce Development for Under-Resourced Youth
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight" data-testid="text-community-heading">
            Community Access &<br />Career Pipeline Programs
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-4">
            AI Mastery Academy empowers under-resourced youth ages 14-24 with AI skills training, career readiness, and school-to-career employment pathways.
          </p>
          <p className="text-sm md:text-base text-white/60 max-w-xl mx-auto mb-10">
            Six dedicated programs removing barriers to workforce development — from free access and mentorship to career placement and bilingual support.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-violet-700 border-white/80" data-testid="button-hero-apply">
              <DollarSign className="mr-2 h-5 w-5" />
              Apply for Free Access
            </Button>
            <Link href="/">
              <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10" data-testid="button-hero-learn-more">
                Explore Career Pathways
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
              <Briefcase className="mr-1 h-3 w-3" /> 6 Workforce & Equity Programs
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-programs-heading">
              Building School-to-Career Pipelines
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From financial assistance to career placement, these programs ensure under-resourced youth ages 14-24 gain the AI skills and workforce readiness they need to thrive.
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
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <BarChart3 className="mr-1 h-3 w-3" /> Measurable Impact
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-impact-heading">
              Workforce Development Impact
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Our programs deliver measurable outcomes aligned with workforce development goals — tracking youth engagement, career placements, mentorship connections, and employer partnerships to demonstrate real impact in under-resourced communities.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12">
            {impactMetrics.map((metric) => (
              <Card key={metric.label} className="p-6 text-center" data-testid={`card-metric-${metric.label.toLowerCase().replace(/\s/g, '-')}`}>
                <metric.icon className="h-6 w-6 mx-auto mb-3 text-primary" />
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {metric.value}
                </p>
                <p className="text-sm font-medium mt-1">{metric.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Globe className="mr-1 h-3 w-3" /> Scaling Nationwide
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-expanding-heading">
              Expanding Career Pipelines Nationwide
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Austin is our pilot city — the proving ground for a workforce development model designed to scale. Every lesson learned here shapes how we bring equitable career access to under-resourced youth in cities across the country. Our goal is to launch in 10 additional cities by 2027, adapting each program to local workforce needs while maintaining the quality and impact that define AI Mastery Academy.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mt-12">
            {[
              { value: "1", label: "Pilot City" },
              { value: "6", label: "Career Pipeline Programs" },
              { value: "10+", label: "Cities by 2027" },
              { value: "100%", label: "Free for Under-Resourced Youth" },
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
              <Briefcase className="h-10 w-10 mx-auto mb-4 text-white/80" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="text-cta-heading">
                Start Your Career Pipeline Journey
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-8">
                Whether you're a young person seeking AI skills and career readiness training, a parent supporting your child's workforce development, or a school administrator looking to bring career pipeline programs to your campus — we're here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-white text-violet-700 border-white/80" data-testid="button-apply-free-access">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Apply for Free Access
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10" data-testid="button-school-admin-info">
                  <Building2 className="mr-2 h-5 w-5" />
                  Partner With Us
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer className="py-10 px-6 border-t">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI Mastery Academy & School Support Hub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Empowering under-resourced youth through AI skills, career pipelines, and workforce development.
          </p>
          <div className="flex flex-col items-end gap-1">
            <a href="mailto:sisnett.meredith@gmail.com" className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="link-support-email" aria-label="Email sisnett.meredith@gmail.com">
              <Mail className="h-3.5 w-3.5" /> sisnett.meredith@gmail.com
            </a>
            <a href="mailto:mr.terryflood@gmail.com" className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="link-support-email-2" aria-label="Email mr.terryflood@gmail.com">
              <Mail className="h-3.5 w-3.5" /> mr.terryflood@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
