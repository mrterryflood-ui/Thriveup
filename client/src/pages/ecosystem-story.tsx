import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Search, MapPin, Users, BookOpen, FileText, Award, Rocket,
  BarChart3, TrendingUp, Globe, ChevronLeft, ChevronRight,
  ArrowRight, Sparkles, Shield, Target, Activity,
} from "lucide-react";

interface StoryStep {
  id: number;
  phase: string;
  title: string;
  description: string;
  icon: typeof Search;
  activePlatforms: string[];
  supportingPlatforms: string[];
  details: string[];
  highlight: string;
}

const storySteps: StoryStep[] = [
  {
    id: 1,
    phase: "Day 1",
    title: "Discovery",
    description: "The Incubator detects a DFC opportunity on SAM.gov. AI scores it 94% fit. Alert sent to the team.",
    icon: Search,
    activePlatforms: ["The Incubator", "ThriveUp Academy"],
    supportingPlatforms: ["MCE", "LifeBridge"],
    details: [
      "Automated SAM.gov scanning identifies new Drug-Free Communities (DFC) grant posting",
      "AI Grant Scorer analyzes alignment: 94% match based on community need, organizational capacity, and evidence base",
      "Instant alert sent to program leadership with grant summary and recommended action timeline",
      "Pre-populated grant brief generated with key requirements and deadlines",
    ],
    highlight: "94% AI fit score",
  },
  {
    id: 2,
    phase: "Week 1",
    title: "Assessment",
    description: "ThriveUp's Community Map pulls CDC, Census, SAMHSA data. Community readiness assessment launched.",
    icon: MapPin,
    activePlatforms: ["ThriveUp Academy", "LifeBridge"],
    supportingPlatforms: ["RPLICE", "Sankofa Health"],
    details: [
      "Community Map aggregates real-time data from CDC WONDER, Census ACS, and SAMHSA NSDUH",
      "Risk and protective factor analysis auto-generated for the target community",
      "LifeBridge identifies existing local resources, gaps, and potential partners",
      "Community readiness assessment survey deployed to key stakeholders",
    ],
    highlight: "Multi-source data fusion",
  },
  {
    id: 3,
    phase: "Week 2",
    title: "Coalition Building",
    description: "Coalition Dashboard activates 12-sector mapping. Partners identified across all required sectors.",
    icon: Users,
    activePlatforms: ["ThriveUp Academy", "MCE", "M2C Transition"],
    supportingPlatforms: ["LifeBridge", "The Incubator"],
    details: [
      "Coalition Dashboard maps all 12 required DFC sectors with current coverage",
      "MCE connects minority-owned businesses for Sector 8 (Business Community)",
      "M2C Transition brings veteran organizations for additional community engagement",
      "Partner gap analysis identifies missing sectors and recommends recruitment targets",
    ],
    highlight: "12-sector coalition mapping",
  },
  {
    id: 4,
    phase: "Week 3",
    title: "Evidence Base",
    description: "RPLICE's evidence registry identifies matching evidence-based programs for the community's needs.",
    icon: BookOpen,
    activePlatforms: ["RPLICE", "ThriveUp Academy", "Sankofa Health"],
    supportingPlatforms: ["LifeBridge", "Perfectly Different"],
    details: [
      "RPLICE evidence registry queries for EBPs matching identified risk factors",
      "Prevention curriculum mapped to specific community needs and demographics",
      "Sankofa Health provides behavioral health baseline data for target population",
      "Fidelity monitoring framework pre-configured for selected interventions",
    ],
    highlight: "Evidence-based program matching",
  },
  {
    id: 5,
    phase: "Month 1",
    title: "Application",
    description: "Grant Narrative Builder pulls live data from all activated platforms. Logic Model auto-populates.",
    icon: FileText,
    activePlatforms: ["ThriveUp Academy", "The Incubator", "RPLICE"],
    supportingPlatforms: ["MCE", "LifeBridge", "Sankofa Health"],
    details: [
      "Grant Narrative Builder pulls real-time data from all activated platforms",
      "Logic Model auto-populates inputs, activities, outputs, and outcomes from platform data",
      "DFC Readiness checklist tracks every requirement with completion status",
      "Budget builder calculates staffing, facilities, and in-kind match requirements",
    ],
    highlight: "Auto-populated narrative",
  },
  {
    id: 6,
    phase: "Month 3",
    title: "AWARDED!",
    description: "Post-Award Management activates. Staffing plan built. Facilities identified. Compliance calendar set.",
    icon: Award,
    activePlatforms: ["ThriveUp Academy", "The Incubator"],
    supportingPlatforms: ["MCE", "LifeBridge", "M2C Transition", "RPLICE"],
    details: [
      "Post-Award Management module activates with project setup wizard",
      "Staffing plan generated with position descriptions, qualifications, and hiring timeline",
      "Facilities identification process launched with in-kind space options mapped",
      "Compliance calendar auto-populated with semi-annual reports, site visits, and data submissions",
      "In-kind contribution tracker initialized with match requirements",
    ],
    highlight: "$625K secured",
  },
  {
    id: 7,
    phase: "Month 4-12",
    title: "Execution",
    description: "Prevention curriculum delivered. Parent education launched. Coalition meets monthly.",
    icon: Rocket,
    activePlatforms: ["ThriveUp Academy", "RPLICE", "Sankofa Health", "LifeBridge"],
    supportingPlatforms: ["MCE", "M2C Transition", "Perfectly Different", "SafeReport"],
    details: [
      "Prevention curriculum sessions delivered to youth with fidelity monitoring",
      "Parent education modules launched with engagement tracking",
      "Coalition meets monthly with automated agenda generation and action item tracking",
      "Environmental strategies deployed across community sectors",
      "SafeReport handles anonymous incident reporting and compliance documentation",
    ],
    highlight: "Multi-program delivery",
  },
  {
    id: 8,
    phase: "Ongoing",
    title: "Measurement",
    description: "RPLICE tracks RE-AIM framework. DFC Command Center shows real-time metrics across all programs.",
    icon: BarChart3,
    activePlatforms: ["RPLICE", "ThriveUp Academy"],
    supportingPlatforms: ["Sankofa Health", "SafeReport", "LifeBridge"],
    details: [
      "RPLICE tracks RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance)",
      "DFC Command Center shows real-time metrics across all active programs",
      "Stakeholder satisfaction surveys deployed quarterly with automated analysis",
      "Core measures reported to SAMHSA with data pre-populated from delivery logs",
    ],
    highlight: "RE-AIM framework tracking",
  },
  {
    id: 9,
    phase: "Year 2-5",
    title: "Sustain & Grow",
    description: "MAP-GAP CQI runs continuous improvement. Sustainability plan builds alternative funding streams.",
    icon: TrendingUp,
    activePlatforms: ["ThriveUp Academy", "The Incubator", "MCE"],
    supportingPlatforms: ["RPLICE", "LifeBridge", "M2C Transition"],
    details: [
      "MAP-GAP CQI engine runs continuous quality improvement cycles",
      "Sustainability plan identifies and develops alternative funding streams",
      "Community readiness scores advance through stages with targeted interventions",
      "Program expansion informed by outcome data and community feedback",
    ],
    highlight: "Continuous improvement",
  },
  {
    id: 10,
    phase: "Always",
    title: "The Ecosystem Effect",
    description: "Data flows between ALL 20 platforms throughout this journey, creating a living intelligence network.",
    icon: Globe,
    activePlatforms: [
      "ThriveUp Academy", "The Incubator", "MCE", "LifeBridge", "RPLICE",
      "Sankofa Health", "M2C Transition", "SafeReport", "Perfectly Different",
    ],
    supportingPlatforms: [],
    details: [
      "Every platform contributes data to a shared intelligence layer",
      "Grant outcomes feed back into evidence registry for future applications",
      "Community data continuously updates risk and protective factor models",
      "Coalition engagement metrics inform future partnership strategies",
      "Workforce data from MCE connects business development to community outcomes",
      "The ecosystem amplifies every individual platform's impact exponentially",
    ],
    highlight: "14 platforms, 1 mission",
  },
];

export default function EcosystemStoryPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = storySteps[currentStep];
  const progress = ((currentStep + 1) / storySteps.length) * 100;

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, storySteps.length - 1));
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-story-title">The Ecosystem in Action</h1>
        <p className="text-muted-foreground">
          How ThriveUp Academy wins and executes a $625K Drug-Free Communities Grant — a real scenario showing all 14 platforms working together.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {storySteps.length}</span>
          <span>{step.phase}: {step.title}</span>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-story" />
      </div>

      <div className="flex flex-wrap gap-2">
        {storySteps.map((s, i) => (
          <Button
            key={s.id}
            variant={i === currentStep ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentStep(i)}
            data-testid={`button-step-${s.id}`}
          >
            {s.phase}
          </Button>
        ))}
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="rounded-md p-3 bg-primary/10 shrink-0">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge data-testid="badge-step-phase">{step.phase}</Badge>
                <h2 className="text-xl font-bold" data-testid="text-step-title">{step.title}</h2>
              </div>
              <p className="text-muted-foreground" data-testid="text-step-description">{step.description}</p>
            </div>
            <Badge variant="secondary" className="shrink-0" data-testid="badge-step-highlight">
              <Sparkles className="h-3 w-3 mr-1" />
              {step.highlight}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Active Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {step.activePlatforms.map((p) => (
                  <Badge key={p} data-testid={`badge-active-${p.toLowerCase().replace(/\s/g, '-')}`}>{p}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Supporting Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {step.supportingPlatforms.map((p) => (
                  <Badge key={p} variant="outline" data-testid={`badge-supporting-${p.toLowerCase().replace(/\s/g, '-')}`}>{p}</Badge>
                ))}
                {step.supportingPlatforms.length === 0 && (
                  <span className="text-sm text-muted-foreground">All platforms active</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              What Happens
            </h3>
            <div className="grid gap-2">
              {step.details.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStep === 0}
          data-testid="button-prev-step"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>

        {currentStep === storySteps.length - 1 ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/dfc-wizards">
              <Button data-testid="button-start-journey">
                <Rocket className="mr-2 h-4 w-4" /> Start Your DFC Journey
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" data-testid="button-contact-us">
                Contact Us
              </Button>
            </Link>
          </div>
        ) : (
          <Button onClick={goNext} data-testid="button-next-step">
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4" data-testid="text-platform-flow-title">Platform Data Flow</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            "ThriveUp Academy", "The Incubator", "MCE", "LifeBridge", "RPLICE",
            "Sankofa Health", "M2C Transition", "SafeReport", "Perfectly Different",
            "ParentConnect", "FiscalBridge", "Compliance Pro", "Data Insights", "Grant Navigator",
          ].map((platform) => {
            const isActive = step.activePlatforms.includes(platform);
            const isSupporting = step.supportingPlatforms.includes(platform);
            return (
              <div
                key={platform}
                className={`rounded-md p-2 text-center text-xs font-medium border transition-colors ${
                  isActive
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : isSupporting
                    ? "bg-muted border-border text-foreground"
                    : "bg-muted/50 border-transparent text-muted-foreground"
                }`}
                data-testid={`platform-indicator-${platform.toLowerCase().replace(/\s/g, '-')}`}
              >
                {platform}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Highlighted platforms are actively contributing data at this stage
        </p>
      </Card>
    </div>
  );
}
