import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AcademyWizard from "@/components/academy-wizard";
import { WIZARD_STEPS } from "@/lib/wizard-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Home,
  Lock,
  Unlock,
  TreePine,
  Palette,
  Book,
  Monitor,
  Wallet,
  Flag,
  Hammer,
  Layers,
  Sofa,
  PaintBucket,
  Users,
  CheckCircle2,
  Circle,
  Mail,
  UtensilsCrossed,
  BedDouble,
  Bath,
  BookOpen,
  Flower2,
  DoorOpen,
  Dumbbell,
  GraduationCap,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";

interface CampusProject {
  id: string;
  userId: string;
  projectName: string;
  totalBudget: string;
  amountFunded: string;
  currentPhase: number;
  completedPhases: number[];
  features: string[];
  createdAt: string;
}

interface WalletData {
  balance: string;
  totalEarned: string;
  totalInvested: string;
  campusContributed: string;
}

const PHASES = [
  { phase: 1, name: "Foundation", cost: 5000, cumulative: 5000, description: "Lay the groundwork for your dream", icon: Hammer },
  { phase: 2, name: "Structure", cost: 10000, cumulative: 15000, description: "Build the walls and roof", icon: Layers },
  { phase: 3, name: "Interior", cost: 12000, cumulative: 27000, description: "Design your living spaces", icon: Sofa },
  { phase: 4, name: "Exterior", cost: 10000, cumulative: 37000, description: "Landscaping and curb appeal", icon: PaintBucket },
  { phase: 5, name: "Community Space", cost: 13000, cumulative: 50000, description: "Create spaces for everyone", icon: Users },
];

interface FeatureUnlock {
  milestone: number;
  label: string;
  features: { name: string; icon: LucideIcon }[];
}

const FEATURE_UNLOCKS: FeatureUnlock[] = [
  { milestone: 5000, label: "$5K", features: [{ name: "Front Yard", icon: TreePine }, { name: "Mailbox", icon: Mail }] },
  { milestone: 10000, label: "$10K", features: [{ name: "Living Room", icon: Sofa }, { name: "Kitchen", icon: UtensilsCrossed }] },
  { milestone: 15000, label: "$15K", features: [{ name: "Bedrooms", icon: BedDouble }, { name: "Bathroom", icon: Bath }] },
  { milestone: 22000, label: "$22K", features: [{ name: "Study Room", icon: BookOpen }, { name: "Art Studio", icon: Palette }] },
  { milestone: 30000, label: "$30K", features: [{ name: "Garden", icon: Flower2 }, { name: "Porch", icon: DoorOpen }] },
  { milestone: 37000, label: "$37K", features: [{ name: "Community Garden", icon: TreePine }, { name: "Basketball Court", icon: Dumbbell }] },
  { milestone: 45000, label: "$45K", features: [{ name: "Library", icon: Book }, { name: "Computer Lab", icon: Monitor }] },
  { milestone: 50000, label: "$50K", features: [{ name: "Grand Opening Ceremony", icon: Trophy }] },
];

function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getPhaseStatus(phaseIndex: number, funded: number): "completed" | "in-progress" | "locked" {
  const phase = PHASES[phaseIndex];
  const prevCumulative = phaseIndex > 0 ? PHASES[phaseIndex - 1].cumulative : 0;
  if (funded >= phase.cumulative) return "completed";
  if (funded >= prevCumulative) return "in-progress";
  return "locked";
}

function VisualBuilding({ fundedPercent }: { fundedPercent: number }) {
  return (
    <div className="relative w-full h-48 flex items-end justify-center" data-testid="visual-building">
      <div className="absolute bottom-0 w-full h-6 bg-muted rounded-md" />

      {fundedPercent >= 10 && (
        <div className="absolute bottom-6 w-40 h-3 border-2 border-dashed border-muted-foreground/40 rounded-sm" data-testid="building-foundation" />
      )}

      {fundedPercent >= 25 && (
        <div className="absolute bottom-6 w-40 h-24 bg-amber-800/20 dark:bg-amber-600/20 border-2 border-amber-800/40 dark:border-amber-600/40 rounded-sm" data-testid="building-walls" />
      )}

      {fundedPercent >= 50 && (
        <div className="absolute bottom-[7.5rem] w-0 h-0 border-l-[5.5rem] border-r-[5.5rem] border-b-[3rem] border-l-transparent border-r-transparent border-b-red-700/30 dark:border-b-red-500/30" data-testid="building-roof" />
      )}

      {fundedPercent >= 75 && (
        <>
          <div className="absolute bottom-10 left-1/2 -translate-x-8 w-5 h-5 bg-sky-300/50 dark:bg-sky-400/30 border border-sky-500/40 rounded-sm" data-testid="building-window-1" />
          <div className="absolute bottom-10 left-1/2 translate-x-3 w-5 h-5 bg-sky-300/50 dark:bg-sky-400/30 border border-sky-500/40 rounded-sm" data-testid="building-window-2" />
          <div className="absolute bottom-6 left-1/2 -translate-x-2.5 w-5 h-8 bg-amber-700/30 dark:bg-amber-500/20 border border-amber-700/40 rounded-t-sm" data-testid="building-door" />
        </>
      )}

      {fundedPercent >= 100 && (
        <>
          <div className="absolute bottom-[9.5rem] left-1/2 -translate-x-0.5 flex flex-col items-center" data-testid="building-flag">
            <Flag className="h-4 w-4 text-primary" />
            <div className="w-0.5 h-3 bg-primary" />
          </div>
          <div className="absolute bottom-8 left-1/2 translate-x-12 w-3 h-6 bg-emerald-500/30 rounded-full" />
          <div className="absolute bottom-7 left-1/2 translate-x-16 w-4 h-8 bg-emerald-600/30 rounded-full" />
          <div className="absolute bottom-8 left-1/2 -translate-x-14 w-3 h-6 bg-emerald-500/30 rounded-full" />
          <div className="absolute bottom-7 left-1/2 -translate-x-[4.5rem] w-4 h-8 bg-emerald-600/30 rounded-full" />
        </>
      )}

      {fundedPercent < 10 && (
        <p className="absolute bottom-8 text-xs text-muted-foreground" data-testid="text-empty-lot">Empty lot - start funding to build!</p>
      )}
    </div>
  );
}

function CreateProjectForm() {
  const { toast } = useToast();
  const [projectName, setProjectName] = useState("");

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/academy/campus", { projectName: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/campus"] });
      toast({ title: "Project Created", description: "Your campus project is ready to build!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 max-w-lg mx-auto mt-12" data-testid="create-project-form">
      <Card className="p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2" data-testid="text-create-title">Build Your Black Campus</h2>
        <p className="text-muted-foreground mb-6" data-testid="text-create-subtitle">Design your dream home and community space</p>
        <div className="space-y-4">
          <Input
            placeholder="Enter your project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            data-testid="input-project-name"
          />
          <Button
            className="w-full"
            onClick={() => createMutation.mutate(projectName)}
            disabled={!projectName.trim() || createMutation.isPending}
            data-testid="button-start-building"
          >
            {createMutation.isPending ? "Creating..." : "Start Building"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function FundFromWallet({ project }: { project: CampusProject }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");

  const { data: wallet } = useQuery<WalletData>({
    queryKey: ["/api/academy/wallet"],
  });

  const fundMutation = useMutation({
    mutationFn: async (fundAmount: number) => {
      await apiRequest("POST", "/api/academy/campus/fund", { amount: fundAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/campus"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/wallet"] });
      setAmount("");
      toast({ title: "Funded!", description: "Your campus project has been funded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const funded = parseFloat(project.amountFunded);
  const budget = parseFloat(project.totalBudget);
  const remaining = budget - funded;
  const walletBalance = parseFloat(wallet?.balance ?? "0") || 0;

  return (
    <div className="space-y-3" data-testid="fund-from-wallet">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wallet className="h-4 w-4" />
        <span data-testid="text-wallet-balance">Wallet Balance: {formatMoney(walletBalance)}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Input
          type="number"
          placeholder="Amount to fund"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          max={Math.min(remaining, walletBalance)}
          className="flex-1 min-w-[120px]"
          data-testid="input-fund-amount"
        />
        <Button
          onClick={() => fundMutation.mutate(parseFloat(amount))}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance || parseFloat(amount) > remaining || fundMutation.isPending}
          data-testid="button-fund-campus"
        >
          {fundMutation.isPending ? "Funding..." : "Fund from Wallet"}
        </Button>
      </div>
    </div>
  );
}

export default function AcademyCampusPage() {
  useEffect(() => { document.title = 'Campus Builder | ThriveUp Academy'; }, []);
  const { data: project, isLoading, error, refetch: refetchCampus } = useQuery<CampusProject>({
    queryKey: ["/api/academy/campus"],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4" data-testid="campus-loading">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error && !(error as any)?.message?.includes("404")) {
    return <div className="p-6"><ErrorRetry message="Failed to load campus project." onRetry={refetchCampus} /></div>;
  }

  if (error || !project) {
    return <CreateProjectForm />;
  }

  const funded = parseFloat(project.amountFunded);
  const budget = parseFloat(project.totalBudget);
  const fundedPercent = Math.min((funded / budget) * 100, 100);

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="campus-page">
      <PageHeader
        title="Build Your Campus"
        description="Design your dream home and community space"
        breadcrumbs={[
          { label: "Academy", href: "/academy" },
          { label: "Campus" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6" data-testid="card-project-overview">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <h2 className="font-semibold text-lg" data-testid="text-project-name">{project.projectName}</h2>
              <p className="text-sm text-muted-foreground" data-testid="text-current-phase">Phase {project.currentPhase} of 5</p>
            </div>
            <Badge variant="secondary" data-testid="badge-current-phase">Phase {project.currentPhase}</Badge>
          </div>

          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className="font-medium" data-testid="text-funding-progress">{formatMoney(funded)} / {formatMoney(budget)}</span>
          </div>
          <Progress value={fundedPercent} className="h-2.5 mb-4" data-testid="progress-funding" />
          <p className="text-xs text-muted-foreground mb-4" data-testid="text-funded-percent">{Math.round(fundedPercent)}% funded</p>

          <FundFromWallet project={project} />
        </Card>

        <Card className="p-6" data-testid="card-visual-building">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" /> Your Campus
          </h2>
          <VisualBuilding fundedPercent={fundedPercent} />
        </Card>
      </div>

      <Card className="p-6 mb-8" data-testid="card-building-phases">
        <h2 className="font-semibold mb-6 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" /> Building Phases
        </h2>
        <div className="space-y-4">
          {PHASES.map((phase, idx) => {
            const status = getPhaseStatus(idx, funded);
            const PhaseIcon = phase.icon;
            return (
              <div key={phase.phase} className="flex items-start gap-4" data-testid={`phase-${phase.phase}`}>
                <div className="flex flex-col items-center shrink-0">
                  <div className={`rounded-full p-2 ${
                    status === "completed" ? "bg-emerald-100 dark:bg-emerald-900/30" :
                    status === "in-progress" ? "bg-primary/10" :
                    "bg-muted"
                  }`}>
                    {status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : status === "in-progress" ? (
                      <PhaseIcon className="h-5 w-5 text-primary" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {idx < PHASES.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${
                      status === "completed" ? "bg-emerald-400 dark:bg-emerald-600" : "bg-muted"
                    }`} />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-medium ${status === "locked" ? "text-muted-foreground" : ""}`} data-testid={`text-phase-name-${phase.phase}`}>
                      Phase {phase.phase}: {phase.name}
                    </p>
                    <Badge variant={status === "completed" ? "default" : "secondary"} className="text-xs" data-testid={`badge-phase-status-${phase.phase}`}>
                      {status === "completed" ? "Completed" : status === "in-progress" ? "In Progress" : "Locked"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5" data-testid={`text-phase-desc-${phase.phase}`}>{phase.description}</p>
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`text-phase-cost-${phase.phase}`}>Cost: {formatMoney(phase.cost)} (Cumulative: {formatMoney(phase.cumulative)})</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6" data-testid="card-feature-unlocks">
        <h2 className="font-semibold mb-6 flex items-center gap-2">
          <Unlock className="h-5 w-5 text-primary" /> Feature Unlocks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {FEATURE_UNLOCKS.map((group) =>
            group.features.map((feature) => {
              const unlocked = funded >= group.milestone;
              const FeatureIcon = feature.icon;
              return (
                <Card
                  key={`${group.milestone}-${feature.name}`}
                  className={`p-4 ${unlocked ? "" : "opacity-60"}`}
                  data-testid={`feature-${feature.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2 shrink-0 ${
                      unlocked
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : "bg-muted"
                    }`}>
                      <FeatureIcon className={`h-4 w-4 ${
                        unlocked
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${!unlocked ? "text-muted-foreground" : ""}`} data-testid={`text-feature-name-${feature.name.toLowerCase().replace(/\s+/g, "-")}`}>{feature.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {unlocked ? (
                          <Unlock className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">{group.label}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Card>
      <AcademyWizard wizardType="campus" steps={WIZARD_STEPS["campus"]} />
    </div>
  );
}
