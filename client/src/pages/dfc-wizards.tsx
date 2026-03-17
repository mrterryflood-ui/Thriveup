import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Shield, FileText, Target, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, Wand2,
  BookOpen, ClipboardCheck, BarChart3, Heart,
  Megaphone, Globe, Scale, Building2, Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DFCCrossNav } from "@/components/dfc-cross-nav";

interface WizardStep {
  title: string;
  description: string;
  icon: LucideIcon;
  linkTo?: string;
  linkLabel?: string;
  inlineContent?: string;
}

interface WizardDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  steps: WizardStep[];
}

const WIZARDS: WizardDef[] = [
  {
    id: "coalition-setup",
    title: "Coalition Setup Wizard",
    description: "Build your 12-sector DFC coalition from the ground up",
    icon: Users,
    steps: [
      {
        title: "Name Your Coalition",
        description: "Define your coalition's name and mission statement. This will appear on all official DFC documentation and communications.",
        icon: Users,
        inlineContent: "Enter your coalition name and a brief mission statement that describes your community prevention goals.",
      },
      {
        title: "Map Your 12 Sectors",
        description: "Identify which of the 12 required DFC sectors you have representatives for, and which are gaps that need to be filled.",
        icon: Target,
        linkTo: "/coalition",
        linkLabel: "Open Coalition Sector Map",
      },
      {
        title: "Add Founding Members",
        description: "Assign at least one member to each represented sector. Include their name, role, organization, and contact information.",
        icon: Users,
        linkTo: "/coalition",
        linkLabel: "Add Coalition Members",
      },
      {
        title: "Schedule First Meeting",
        description: "Schedule your inaugural coalition meeting. Set the date, location, and agenda for your first gathering.",
        icon: Calendar,
        linkTo: "/coalition",
        linkLabel: "Schedule Meeting",
      },
      {
        title: "Complete Capacity Assessment",
        description: "Conduct an initial capacity assessment to establish your coalition's baseline across organizational, leadership, knowledge, and engagement dimensions.",
        icon: BarChart3,
        linkTo: "/coalition",
        linkLabel: "Take Capacity Assessment",
      },
      {
        title: "Create Community Action Plan",
        description: "Create your first community action plan aligned with the SPF Assessment phase. This plan will guide your coalition's initial activities.",
        icon: ClipboardCheck,
        linkTo: "/coalition",
        linkLabel: "Create Action Plan",
      },
      {
        title: "Review & Launch",
        description: "Review everything you've set up and officially launch your coalition. Check all items below to confirm readiness.",
        icon: CheckCircle2,
        inlineContent: "Congratulations! Review the summary of your coalition setup below.",
      },
    ],
  },
  {
    id: "prevention-launch",
    title: "Prevention Launch Wizard",
    description: "Set up your community's prevention programming framework",
    icon: Shield,
    steps: [
      {
        title: "Select Target Groups & Substances",
        description: "Choose your target age group(s) and priority substances based on your community needs assessment data.",
        icon: Target,
        inlineContent: "Select the age groups and substance categories your prevention programming will target.",
      },
      {
        title: "Choose Evidence-Based Programs",
        description: "Browse the EBP registry and select programs that match your community's needs, population, and resources.",
        icon: BookOpen,
        linkTo: "/prevention-strategies",
        linkLabel: "Browse EBP Registry",
      },
      {
        title: "Set Up Prevention Curriculum",
        description: "Configure your prevention curriculum modules by age group and substance topic.",
        icon: BookOpen,
        linkTo: "/prevention",
        linkLabel: "View Prevention Curriculum",
      },
      {
        title: "Configure Assessments",
        description: "Set up risk and protective factor assessments to measure your prevention impact over time.",
        icon: ClipboardCheck,
        linkTo: "/prevention",
        linkLabel: "Configure Risk Assessments",
      },
      {
        title: "Create Baseline Survey",
        description: "Deploy your youth substance use baseline survey to establish community-level data before programming begins.",
        icon: BarChart3,
        linkTo: "/dfc-reporting",
        linkLabel: "Record Baseline Data",
      },
      {
        title: "Set Up Parent Education",
        description: "Configure parent education modules to complement your youth prevention programming.",
        icon: Heart,
        linkTo: "/parent-education",
        linkLabel: "View Parent Education",
      },
      {
        title: "Plan Environmental Strategy",
        description: "Design your first environmental strategy to address community-level risk factors.",
        icon: Building2,
        linkTo: "/prevention-strategies",
        linkLabel: "Add Environmental Strategy",
      },
      {
        title: "Launch Prevention Program",
        description: "Review all configured elements and launch your prevention programming.",
        icon: CheckCircle2,
        inlineContent: "Your prevention framework is ready! Review the summary below.",
      },
    ],
  },
  {
    id: "grant-application",
    title: "Grant Application Wizard",
    description: "Prepare your Drug-Free Communities grant application step by step",
    icon: FileText,
    steps: [
      {
        title: "Verify SAM.gov Registration",
        description: "Confirm your organization's SAM.gov registration and Unique Entity Identifier (UEI) are current and active.",
        icon: Globe,
        inlineContent: "Verify that your fiscal agent has an active SAM.gov registration and valid UEI number.",
      },
      {
        title: "Confirm Coalition Eligibility",
        description: "Verify your coalition meets the 12-sector requirement and has been active for at least 6 months.",
        icon: Users,
        linkTo: "/coalition",
        linkLabel: "Check Sector Coverage",
      },
      {
        title: "Community Readiness Assessment",
        description: "Complete or review your community readiness assessment to demonstrate community awareness of substance misuse issues.",
        icon: Target,
        linkTo: "/dfc-reporting",
        linkLabel: "View Community Readiness",
      },
      {
        title: "Build Logic Model",
        description: "Create your prevention logic model showing inputs, activities, outputs, and outcomes.",
        icon: Scale,
        linkTo: "/logic-model",
        linkLabel: "Open Logic Model Builder",
      },
      {
        title: "Draft Grant Narrative",
        description: "Write your grant narrative sections including community description, coalition history, and prevention strategy.",
        icon: FileText,
        linkTo: "/grant-narrative",
        linkLabel: "Open Narrative Builder",
      },
      {
        title: "Document Cost Match",
        description: "Document your cost match contributions totaling at least $125,000 from community partners.",
        icon: BarChart3,
        linkTo: "/coalition",
        linkLabel: "Record Cost Match",
      },
      {
        title: "Collect Stakeholder Commitments",
        description: "Gather letters of support, MOUs, and commitments from all 12 coalition sectors.",
        icon: Users,
        linkTo: "/dfc-readiness",
        linkLabel: "Manage Commitments",
      },
      {
        title: "Plan Media Campaigns",
        description: "Design media and awareness campaigns that demonstrate community engagement and prevention messaging.",
        icon: Megaphone,
        linkTo: "/dfc-readiness",
        linkLabel: "Plan Campaigns",
      },
      {
        title: "Set Up Evaluation Framework",
        description: "Configure your evaluation approach using RE-AIM and CFIR frameworks to measure implementation and outcomes.",
        icon: BarChart3,
        linkTo: "/prevention-strategies",
        linkLabel: "View CFIR Dashboard",
      },
      {
        title: "Final Review & Submit",
        description: "Review your application readiness score and complete the submission checklist.",
        icon: CheckCircle2,
        linkTo: "/dfc-readiness",
        linkLabel: "View Readiness Checklist",
      },
    ],
  },
  {
    id: "community-assessment",
    title: "Community Assessment Wizard",
    description: "Systematic data collection for ongoing community monitoring",
    icon: ClipboardCheck,
    steps: [
      {
        title: "Deploy Youth Survey",
        description: "Administer the youth substance use survey to collect 30-day prevalence, perception of risk, and parental disapproval data.",
        icon: BarChart3,
        linkTo: "/prevention",
        linkLabel: "View Youth Surveys",
      },
      {
        title: "Conduct Stakeholder Surveys",
        description: "Survey all 10 stakeholder populations to gather community perspectives on substance misuse issues.",
        icon: Users,
        linkTo: "/dfc-reporting",
        linkLabel: "Record Stakeholder Surveys",
      },
      {
        title: "Key Informant Interviews",
        description: "Conduct community readiness key informant interviews to assess community awareness and readiness dimensions.",
        icon: Users,
        linkTo: "/dfc-reporting",
        linkLabel: "Record Interviews",
      },
      {
        title: "Record Core Measures",
        description: "Enter DFC Core Measure data including 30-day substance use rates and perception measures.",
        icon: BarChart3,
        linkTo: "/dfc-reporting",
        linkLabel: "Enter Core Measures",
      },
      {
        title: "Update Risk/Protective Data",
        description: "Collect and record updated risk and protective factor assessment data from your target populations.",
        icon: Shield,
        linkTo: "/prevention",
        linkLabel: "View Risk Assessments",
      },
      {
        title: "Generate Comparison Report",
        description: "Compare current data to baseline measurements and generate a period comparison report.",
        icon: FileText,
        linkTo: "/dfc-reporting",
        linkLabel: "View Comparison Report",
      },
    ],
  },
];

interface WizardState {
  id: string;
  visitorId: string;
  wizardType: string;
  currentStep: number;
  completedSteps: number[];
  metadata: Record<string, unknown>;
}

function WizardSelector({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="section-wizard-selector">
      {WIZARDS.map((wizard) => (
        <Card
          key={wizard.id}
          className="p-5 hover-elevate cursor-pointer"
          onClick={() => onSelect(wizard.id)}
          data-testid={`card-wizard-${wizard.id}`}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
              <wizard.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold" data-testid={`text-wizard-title-${wizard.id}`}>{wizard.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{wizard.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="text-[10px]">{wizard.steps.length} steps</Badge>
                <span className="text-xs text-primary flex items-center gap-1">
                  Start <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function WizardRunner({ wizard, onBack }: { wizard: WizardDef; onBack: () => void }) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const { data: savedStates } = useQuery<WizardState[]>({
    queryKey: ["/api/dfc/wizard-state", wizard.id],
    queryFn: async () => {
      const res = await fetch(`/api/dfc/wizard-state?wizardType=${wizard.id}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    if (savedStates && savedStates.length > 0) {
      const state = savedStates[0];
      setCurrentStep(state.currentStep);
      if (Array.isArray(state.completedSteps)) {
        setCompletedSteps(state.completedSteps);
      }
    }
  }, [savedStates]);

  const saveMutation = useMutation({
    mutationFn: async (data: { currentStep: number; completedSteps: number[] }) => {
      const res = await apiRequest("POST", "/api/dfc/wizard-state", {
        wizardType: wizard.id,
        currentStep: data.currentStep,
        completedSteps: data.completedSteps,
        metadata: {},
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dfc/wizard-state", wizard.id] });
    },
    onError: () => {},
  });

  const step = wizard.steps[currentStep];
  const totalSteps = wizard.steps.length;
  const progressPct = totalSteps > 0 ? Math.round(((completedSteps.length) / totalSteps) * 100) : 0;

  const toggleStepComplete = (stepIdx: number) => {
    let newCompleted: number[];
    if (completedSteps.includes(stepIdx)) {
      newCompleted = completedSteps.filter((s) => s !== stepIdx);
    } else {
      newCompleted = [...completedSteps, stepIdx];
    }
    setCompletedSteps(newCompleted);
    saveMutation.mutate({ currentStep, completedSteps: newCompleted });
  };

  const goToStep = (stepIdx: number) => {
    setCurrentStep(stepIdx);
    saveMutation.mutate({ currentStep: stepIdx, completedSteps });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  return (
    <div data-testid={`section-wizard-runner-${wizard.id}`}>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4" data-testid="button-back-to-wizards">
        <ChevronLeft className="h-4 w-4 mr-1" /> All Wizards
      </Button>

      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
          <wizard.icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold" data-testid="text-wizard-runner-title">{wizard.title}</h2>
          <p className="text-sm text-muted-foreground">{wizard.description}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>{completedSteps.length} of {totalSteps} steps completed</span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-2" data-testid="progress-wizard" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-1" data-testid="section-wizard-steps-nav">
            {wizard.steps.map((s, i) => {
              const isComplete = completedSteps.includes(i);
              const isCurrent = i === currentStep;
              return (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                    isCurrent ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                  }`}
                  data-testid={`button-wizard-step-${i}`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center text-[10px] ${
                      isCurrent ? "border-primary text-primary" : "border-muted-foreground/40"
                    }`}>
                      {i + 1}
                    </span>
                  )}
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-6" data-testid="card-wizard-step-content">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-md p-2 bg-primary/10 shrink-0">
                <step.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg" data-testid="text-step-title">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              </div>
            </div>

            {step.inlineContent && (
              <div className="bg-muted/50 p-4 rounded-md mb-4">
                <p className="text-sm" data-testid="text-step-inline-content">{step.inlineContent}</p>
              </div>
            )}

            {step.linkTo && (
              <Link href={step.linkTo}>
                <Button variant="outline" className="mb-4" data-testid="button-step-link">
                  {step.linkLabel || "Complete This Step"} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}

            {currentStep === totalSteps - 1 && (
              <div className="space-y-3 mb-4" data-testid="section-wizard-summary">
                <h4 className="font-semibold text-sm">Completion Summary</h4>
                {wizard.steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {completedSteps.includes(i) ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                    )}
                    <span className={completedSteps.includes(i) ? "" : "text-muted-foreground"}>{s.title}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant={completedSteps.includes(currentStep) ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleStepComplete(currentStep)}
                  data-testid="button-toggle-step-complete"
                >
                  {completedSteps.includes(currentStep) ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" /> Completed
                    </>
                  ) : (
                    "Mark as Complete"
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentStep === 0}
                  onClick={handlePrev}
                  data-testid="button-wizard-prev"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  size="sm"
                  disabled={currentStep === totalSteps - 1}
                  onClick={handleNext}
                  data-testid="button-wizard-next"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DfcWizardsPage() {
  useEffect(() => {
    document.title = "DFC Wizards | ThriveUp";
  }, []);

  const [selectedWizard, setSelectedWizard] = useState<string | null>(null);
  const activeWizard = WIZARDS.find((w) => w.id === selectedWizard);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6" data-testid="dfc-wizards-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-dfc-wizards-title">
          DFC Guided Wizards
        </h1>
        <p className="text-muted-foreground mt-1">
          Step-by-step guides to set up your coalition, launch prevention programming, and prepare your grant application
        </p>
      </div>

      {activeWizard ? (
        <WizardRunner wizard={activeWizard} onBack={() => setSelectedWizard(null)} />
      ) : (
        <WizardSelector onSelect={setSelectedWizard} />
      )}

      <DFCCrossNav currentPage="coalition" />
    </div>
  );
}
