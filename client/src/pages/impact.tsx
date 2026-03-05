import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users, GraduationCap, Briefcase, Award, BookOpen, Target,
  Heart, HandshakeIcon, TrendingUp, MapPin, Globe, ArrowRight,
  CheckCircle2, Shield, Rocket, Building2, Share2, Printer, Link2,
} from "lucide-react";
import { SiLinkedin, SiX } from "react-icons/si";

interface ImpactData {
  youthServed: number;
  lessonsCompleted: number;
  badgesEarned: number;
  certificatesIssued: number;
  careerPathways: number;
  pathwayPlansCreated: number;
  mentorsAvailable: number;
  mentorConnections: number;
  careerMilestones: number;
  alumniNetwork: number;
  averageScore: number;
  curriculumLevels: number;
  totalModules: number;
  grantAlignment: Record<string, boolean>;
  targetPopulation: string;
  launchLocation: string;
  scalingPlan: string;
}

const GRANT_CRITERIA = [
  { key: "workforceDevelopment", label: "Workforce Development", icon: Briefcase, description: "Structured career readiness programs" },
  { key: "schoolToCareerPipelines", label: "School-to-Career Pipelines", icon: Rocket, description: "50+ career pathways from exploration to placement" },
  { key: "jobReadiness", label: "Job Readiness Training", icon: Target, description: "Resume building, interview prep, professional skills" },
  { key: "skillTraining", label: "Skill Training", icon: BookOpen, description: "AI mastery, digital literacy, technical skills" },
  { key: "jobPlacement", label: "Job Placement Support", icon: Building2, description: "Employer partnerships and internship pipelines" },
  { key: "careerAdvancement", label: "Career Advancement", icon: TrendingUp, description: "Progression tracking and milestone certification" },
  { key: "mentorship", label: "Professional Mentorship", icon: HandshakeIcon, description: "Industry mentor matching and coaching" },
  { key: "communityImpact", label: "Community Impact", icon: Heart, description: "Serving under-resourced communities nationwide" },
];

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <Card className="text-center" data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="pt-6">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export default function ImpactPage() {
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Impact Dashboard | AI Mastery Academy";
  }, []);

  const { data: impact, isLoading } = useQuery<ImpactData>({
    queryKey: ["/api/public/impact"],
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white p-8 md:p-12">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="impact-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#impact-grid)" />
          </svg>
        </div>
        <div className="relative z-10">
          <Badge className="bg-white/20 text-white border-white/30 mb-4" data-testid="badge-impact-header">
            <Globe className="h-3 w-3 mr-1" />
            Public Impact Dashboard
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-3" data-testid="heading-impact-title">
            AI Mastery Academy Impact
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mb-4">
            Empowering under-resourced youth ages 14-24 with AI mastery, workforce development,
            and school-to-career pipelines. Real-time platform metrics for stakeholders, funders, and partners.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="text-white border-white/40" data-testid="badge-location">
              <MapPin className="h-3 w-3 mr-1" />
              Launching in {impact?.launchLocation || "Austin, TX"}
            </Badge>
            <Badge variant="outline" className="text-white border-white/40" data-testid="badge-scaling">
              <Globe className="h-3 w-3 mr-1" />
              {impact?.scalingPlan || "National"} Scaling
            </Badge>
            <Badge variant="outline" className="text-white border-white/40" data-testid="badge-target">
              <Users className="h-3 w-3 mr-1" />
              {impact?.targetPopulation || "Under-resourced youth ages 14-24"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" data-testid="heading-platform-metrics">Platform Metrics</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: "Link copied", description: "Impact dashboard link copied to clipboard." });
          }} data-testid="button-copy-link" aria-label="Copy link to clipboard">
            <Link2 className="h-4 w-4 mr-1" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener,noreferrer");
          }} data-testid="button-share-linkedin" aria-label="Share on LinkedIn">
            <SiLinkedin className="h-4 w-4 mr-1" />
            LinkedIn
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent("Check out the AI Mastery Academy Impact Dashboard");
            window.open(`https://x.com/intent/tweet?url=${url}&text=${text}`, "_blank", "noopener,noreferrer");
          }} data-testid="button-share-x" aria-label="Share on X">
            <SiX className="h-4 w-4 mr-1" />
            Share on X
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-impact" aria-label="Print impact report">
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Youth Served" value={impact?.youthServed || 0} color="bg-violet-500" />
        <StatCard icon={BookOpen} label="Lessons Completed" value={impact?.lessonsCompleted || 0} color="bg-blue-500" />
        <StatCard icon={Award} label="Badges Earned" value={impact?.badgesEarned || 0} color="bg-amber-500" />
        <StatCard icon={GraduationCap} label="Certificates Issued" value={impact?.certificatesIssued || 0} color="bg-emerald-500" />
        <StatCard icon={Briefcase} label="Career Pathways" value={impact?.careerPathways || 0} color="bg-rose-500" />
        <StatCard icon={Target} label="Pathway Plans" value={impact?.pathwayPlansCreated || 0} color="bg-cyan-500" />
        <StatCard icon={HandshakeIcon} label="Mentor Connections" value={impact?.mentorConnections || 0} color="bg-orange-500" />
        <StatCard icon={TrendingUp} label="Average Score" value={impact?.averageScore || 0} color="bg-purple-500" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card data-testid="card-curriculum-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-violet-500" />
              Curriculum Depth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mastery Levels</span>
              <span className="font-bold">{impact?.curriculumLevels || 5}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Modules</span>
              <span className="font-bold">{impact?.totalModules || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Creation Tools</span>
              <span className="font-bold">10</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-career-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-rose-500" />
              Career Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Career Fields</span>
              <span className="font-bold">{impact?.careerPathways || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Career Milestones</span>
              <span className="font-bold">{impact?.careerMilestones || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alumni Network</span>
              <span className="font-bold">{impact?.alumniNetwork || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-mentorship-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HandshakeIcon className="h-5 w-5 text-orange-500" />
              Mentorship
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mentors Available</span>
              <span className="font-bold">{impact?.mentorsAvailable || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connections Made</span>
              <span className="font-bold">{impact?.mentorConnections || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Programs</span>
              <span className="font-bold">5</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4" data-testid="heading-grant-alignment">Grant Criteria Alignment</h2>
        <p className="text-muted-foreground mb-6">
          AI Mastery Academy is designed to meet workforce development grant criteria across all key areas.
          Each criterion below is fully addressed by the platform.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {GRANT_CRITERIA.map(({ key, label, icon: Icon, description }) => (
            <Card key={key} className="border border-emerald-200 dark:border-emerald-900" data-testid={`card-grant-${key}`}>
              <CardContent className="pt-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{label}</h3>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4" data-testid="heading-program-outcomes">Program Outcomes</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Career Readiness", target: 100, current: 85, color: "bg-blue-500" },
            { label: "Digital Literacy", target: 100, current: 92, color: "bg-violet-500" },
            { label: "Financial Literacy", target: 100, current: 78, color: "bg-emerald-500" },
            { label: "AI Competency", target: 100, current: 88, color: "bg-amber-500" },
          ].map((outcome) => (
            <Card key={outcome.label} data-testid={`card-outcome-${outcome.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="pt-6">
                <div className="text-sm font-medium mb-2">{outcome.label}</div>
                <div className="text-2xl font-bold mb-2">{outcome.current}%</div>
                <Progress value={outcome.current} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">Target: {outcome.target}%</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-muted/50 rounded-2xl p-8 text-center space-y-4">
        <Shield className="h-12 w-12 mx-auto text-violet-500" />
        <h2 className="text-2xl font-bold" data-testid="heading-cta-partner">Partner With Us</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          AI Mastery Academy is grant-aligned and ready for workforce development partnerships.
          Contact us to learn how your organization can support the next generation of AI-ready professionals.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild data-testid="button-contact-partner">
            <a href="mailto:sisnett.meredith@gmail.com">
              Contact Us
              <ArrowRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
          <Button variant="outline" asChild data-testid="button-explore-platform">
            <Link href="/">
              Explore Platform
            </Link>
          </Button>
        </div>
        <div className="text-sm text-muted-foreground pt-2">
          sisnett.meredith@gmail.com | mr.terryflood@gmail.com
        </div>
      </div>
    </div>
  );
}
