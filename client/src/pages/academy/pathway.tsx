import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MultiFileUpload, type UploadedFile } from "@/components/multi-file-upload";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";
import { TrainingGuideButton } from "@/components/training-guide";
import {
  Target,
  ChevronRight,
  Lock,
  Unlock,
  Clock,
  CheckCircle2,
  Circle,
  FileEdit,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Wrench,
  Shield,
  Rocket,
  Upload,
} from "lucide-react";

interface PathwayPlan {
  id: string;
  userId: string;
  userName: string;
  currentGrade: number;
  primaryCareerInterest: string | null;
  secondaryCareerInterest: string | null;
  educationPathType: string | null;
  goals: any;
  completedMilestones: string[] | null;
  revisionsThisYear: number;
  lastRevisionDate: string | null;
  status: string;
  advisorId: string | null;
  advisorName: string | null;
  lockedForRevision: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlanRevision {
  id: string;
  planId: string;
  userId: string;
  requestedBy: string;
  requestReason: string;
  previousSnapshot: any;
  newSnapshot: any;
  status: string;
  parentNotified: boolean;
  facultyApproved: boolean;
  approvedBy: string | null;
  approvedByName: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

interface CareerField {
  id: string;
  name: string;
  category: string;
  description: string;
  educationPath: string;
  salaryRange: string | null;
  requiredSkills: string[] | null;
  relatedSubjects: string[] | null;
  gradeLevel: string | null;
  iconName: string | null;
  sortOrder: number | null;
}

const STAGE_THEMES: Record<number, { label: string; desc: string }> = {
  1: { label: "Self-Discovery", desc: "Assess strengths, interests, and readiness" },
  2: { label: "Career Exploration", desc: "Research fields, industries, and pathways" },
  3: { label: "Direction Setting", desc: "Select focus area and education path" },
  4: { label: "Foundation Building", desc: "Core training, certifications, and skill development" },
  5: { label: "Skill Deepening", desc: "Advanced competencies and hands-on experience" },
  6: { label: "Portfolio & Readiness", desc: "Demonstrate skills, build professional portfolio" },
  7: { label: "Placement & Launch", desc: "Job placement, entrepreneurship, or advanced education" },
  8: { label: "Sustain & Advance", desc: "Retention tracking, career growth, and mentoring others" },
};

const EDUCATION_PATHS = ["College", "Trade/Tech", "Military", "Entrepreneurship"];

function getPathIcon(path: string) {
  switch (path?.toLowerCase()) {
    case "college": return GraduationCap;
    case "trade/tech": return Wrench;
    case "military": return Shield;
    case "entrepreneurship": return Rocket;
    default: return Briefcase;
  }
}

function getPathColor(path: string) {
  switch (path?.toLowerCase()) {
    case "college": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "trade/tech": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "military": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "entrepreneurship": return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
    default: return "";
  }
}

function getStageColor(stage: number) {
  const colors = [
    "bg-sky-100 dark:bg-sky-900/30",
    "bg-teal-100 dark:bg-teal-900/30",
    "bg-emerald-100 dark:bg-emerald-900/30",
    "bg-amber-100 dark:bg-amber-900/30",
    "bg-orange-100 dark:bg-orange-900/30",
    "bg-rose-100 dark:bg-rose-900/30",
    "bg-violet-100 dark:bg-violet-900/30",
    "bg-indigo-100 dark:bg-indigo-900/30",
  ];
  return colors[(stage - 1) % colors.length];
}

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-36 w-full rounded-md" />
      <Skeleton className="h-48 w-full" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}

function CreatePathwayWizard({ careers }: { careers: CareerField[] }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [careerInterest, setCareerInterest] = useState("");
  const [educationPath, setEducationPath] = useState("");
  const [shortTermGoal, setShortTermGoal] = useState("");
  const [longTermGoal, setLongTermGoal] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pathway-plan", {
        primaryCareerInterest: careerInterest,
        educationPathType: educationPath,
        goals: { shortTerm: shortTermGoal, longTerm: longTermGoal },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pathway-plan"] });
      toast({ title: "Pathway Created!", description: "Your career pathway plan has been created." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className="p-6 max-w-lg mx-auto" data-testid="card-create-pathway">
      <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
        <Target className="h-5 w-5" /> Create Your Pathway
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Step {step} of 3
      </p>

      <div className="flex gap-1 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
            data-testid={`progress-step-${s}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4" data-testid="section-wizard-step-1">
          <p className="text-sm font-medium">Select your primary career interest</p>
          <Select value={careerInterest} onValueChange={setCareerInterest}>
            <SelectTrigger data-testid="select-career-interest">
              <SelectValue placeholder="Choose a career field" />
            </SelectTrigger>
            <SelectContent>
              {careers.map((c) => (
                <SelectItem key={c.id} value={c.name} data-testid={`option-career-${c.id}`}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!careerInterest}
              data-testid="button-next-step-1"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4" data-testid="section-wizard-step-2">
          <p className="text-sm font-medium">Select your education path type</p>
          <Select value={educationPath} onValueChange={setEducationPath}>
            <SelectTrigger data-testid="select-education-path">
              <SelectValue placeholder="Choose a path" />
            </SelectTrigger>
            <SelectContent>
              {EDUCATION_PATHS.map((p) => (
                <SelectItem key={p} value={p} data-testid={`option-path-${p.toLowerCase().replace("/", "-")}`}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back-step-2">
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!educationPath}
              data-testid="button-next-step-2"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4" data-testid="section-wizard-step-3">
          <p className="text-sm font-medium">Set your goals</p>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Short-term goal</label>
            <Input
              placeholder="What do you want to achieve this year?"
              value={shortTermGoal}
              onChange={(e) => setShortTermGoal(e.target.value)}
              data-testid="input-short-term-goal"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Long-term goal</label>
            <Input
              placeholder="Where do you see yourself in 3-5 years?"
              value={longTermGoal}
              onChange={(e) => setLongTermGoal(e.target.value)}
              data-testid="input-long-term-goal"
            />
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setStep(2)} data-testid="button-back-step-3">
              Back
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!shortTermGoal.trim() || createMutation.isPending}
              data-testid="button-create-pathway"
            >
              {createMutation.isPending ? "Creating..." : "Create Pathway"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function PathwayTimeline({ plan }: { plan: PathwayPlan }) {
  const { toast } = useToast();
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editCareer, setEditCareer] = useState(plan.primaryCareerInterest || "");
  const [editShortGoal, setEditShortGoal] = useState(plan.goals?.shortTerm || "");
  const [editLongGoal, setEditLongGoal] = useState(plan.goals?.longTerm || "");
  const [portfolioFiles, setPortfolioFiles] = useState<UploadedFile[]>([]);

  const handleFilesUploaded = useCallback((files: UploadedFile[]) => {
    setPortfolioFiles((prev) => [...prev, ...files]);
  }, []);

  const { data: revisions, isLoading: revisionsLoading } = useQuery<PlanRevision[]>({
    queryKey: ["/api/pathway-plan", plan.id, "revisions"],
    enabled: revisionsOpen,
  });

  const revisionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/pathway-plan/${plan.id}/request-revision`, {
        requestReason: revisionReason,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pathway-plan"] });
      setShowRevisionForm(false);
      setRevisionReason("");
      toast({ title: "Revision Requested", description: "Your revision request has been submitted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/pathway-plan/${plan.id}`, {
        primaryCareerInterest: editCareer,
        goals: { shortTerm: editShortGoal, longTerm: editLongGoal },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pathway-plan"] });
      setEditing(false);
      toast({ title: "Updated", description: "Your pathway has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const completedSet = new Set(plan.completedMilestones ?? []);
  const PathIcon = getPathIcon(plan.educationPathType || "");
  const stages = [1, 2, 3, 4, 5, 6, 7, 8];
  const currentStage = Math.max(1, Math.min(8, plan.currentGrade - 5));

  return (
    <div className="space-y-6" data-testid="section-pathway-timeline">
      <Card className="p-5" data-testid="card-pathway-overview">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold" data-testid="text-career-interest">
                {plan.primaryCareerInterest || "Not set"}
              </span>
            </div>
            {plan.educationPathType && (
              <Badge
                variant="secondary"
                className={getPathColor(plan.educationPathType)}
                data-testid="badge-education-path"
              >
                <PathIcon className="h-3 w-3 mr-1" />
                {plan.educationPathType}
              </Badge>
            )}
            {plan.advisorName && (
              <p className="text-sm text-muted-foreground" data-testid="text-advisor">
                Advisor: {plan.advisorName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {plan.lockedForRevision ? (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" data-testid="badge-locked">
                <Lock className="h-3 w-3 mr-1" /> Locked
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" data-testid="badge-unlocked">
                <Unlock className="h-3 w-3 mr-1" /> Open
              </Badge>
            )}
          </div>
        </div>

        {plan.goals && (
          <div className="space-y-1 mb-4">
            {plan.goals.shortTerm && (
              <p className="text-sm text-muted-foreground" data-testid="text-short-term-goal">
                Short-term: {plan.goals.shortTerm}
              </p>
            )}
            {plan.goals.longTerm && (
              <p className="text-sm text-muted-foreground" data-testid="text-long-term-goal">
                Long-term: {plan.goals.longTerm}
              </p>
            )}
          </div>
        )}

        {!plan.lockedForRevision && !editing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            data-testid="button-edit-pathway"
          >
            <FileEdit className="h-4 w-4 mr-1" /> Edit Pathway
          </Button>
        )}

        {editing && (
          <Card className="p-4 mt-4" data-testid="card-edit-form">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Career Interest</label>
                <Input
                  value={editCareer}
                  onChange={(e) => setEditCareer(e.target.value)}
                  data-testid="input-edit-career"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Short-term Goal</label>
                <Input
                  value={editShortGoal}
                  onChange={(e) => setEditShortGoal(e.target.value)}
                  data-testid="input-edit-short-goal"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Long-term Goal</label>
                <Input
                  value={editLongGoal}
                  onChange={(e) => setEditLongGoal(e.target.value)}
                  data-testid="input-edit-long-goal"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => editMutation.mutate()}
                  disabled={editMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {editMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </Card>

      <div className="relative ml-6" data-testid="section-pathway-stages">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
        {stages.map((stage) => {
          const theme = STAGE_THEMES[stage];
          const isCurrent = stage === currentStage;
          const isCompleted = stage < currentStage;
          const milestoneKey = `stage-${stage}`;
          const milestoneCompleted = completedSet.has(milestoneKey) || completedSet.has(`grade-${stage + 5}`);

          return (
            <div
              key={stage}
              className="relative pl-10 pb-6"
              data-testid={`timeline-stage-${stage}`}
            >
              <div
                className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : isCompleted
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`timeline-dot-${stage}`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <Target className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <Card
                className={`p-4 ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
                data-testid={`card-stage-${stage}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-sm" data-testid={`text-stage-label-${stage}`}>
                    Stage {stage}: {theme?.label}
                  </h3>
                  {isCurrent && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Current Stage
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2" data-testid={`text-stage-desc-${stage}`}>
                  {theme?.desc}
                </p>
                <div className="flex items-center gap-1">
                  {milestoneCompleted || isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {milestoneCompleted || isCompleted ? "Stage complete" : "In progress"}
                  </span>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <Card className="p-5" data-testid="card-revision-section">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" /> Revisions
        </h3>
        <p className="text-sm text-muted-foreground mb-3" data-testid="text-revision-count">
          {plan.revisionsThisYear} of 3 revisions used this year
        </p>
        <div className="flex gap-1 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < plan.revisionsThisYear ? "bg-primary" : "bg-muted"
              }`}
              data-testid={`revision-indicator-${i}`}
            />
          ))}
        </div>

        {plan.revisionsThisYear < 3 && !showRevisionForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRevisionForm(true)}
            data-testid="button-request-revision"
          >
            <AlertCircle className="h-4 w-4 mr-1" /> Request Revision
          </Button>
        )}
        {plan.revisionsThisYear >= 3 && (
          <p className="text-xs text-muted-foreground">
            All revisions used for this year.
          </p>
        )}

        {showRevisionForm && (
          <div className="mt-4 space-y-3" data-testid="section-revision-form">
            <Textarea
              placeholder="Why do you need a revision?"
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              className="resize-none"
              data-testid="input-revision-reason"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => revisionMutation.mutate()}
                disabled={!revisionReason.trim() || revisionMutation.isPending}
                data-testid="button-submit-revision"
              >
                {revisionMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowRevisionForm(false);
                  setRevisionReason("");
                }}
                data-testid="button-cancel-revision"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <Collapsible open={revisionsOpen} onOpenChange={setRevisionsOpen} className="mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" data-testid="button-toggle-revision-history">
              <ChevronRight className={`h-4 w-4 mr-1 transition-transform ${revisionsOpen ? "rotate-90" : ""}`} />
              Revision History
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 space-y-2" data-testid="section-revision-history">
              {revisionsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : (revisions ?? []).length > 0 ? (
                (revisions ?? []).map((rev) => (
                  <Card key={rev.id} className="p-3" data-testid={`card-revision-${rev.id}`}>
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <p className="text-sm font-medium" data-testid={`text-revision-reason-${rev.id}`}>
                        {rev.requestReason}
                      </p>
                      <Badge
                        variant="secondary"
                        className={
                          rev.status === "approved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : rev.status === "pending"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : ""
                        }
                        data-testid={`badge-revision-status-${rev.id}`}
                      >
                        {rev.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground" data-testid={`text-revision-date-${rev.id}`}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                    {rev.reviewNotes && (
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-revision-notes-${rev.id}`}>
                        Notes: {rev.reviewNotes}
                      </p>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No revision history.</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card className="p-5" data-testid="card-portfolio-uploads">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" /> Portfolio & Evidence Uploads
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload artifacts, projects, and evidence for your milestone portfolio.
        </p>
        <MultiFileUpload
          onFilesUploaded={handleFilesUploaded}
          label="Drop your portfolio files here"
          maxFiles={10}
          maxSizeMB={25}
        />
        {portfolioFiles.length > 0 && (
          <div className="mt-4 space-y-1" data-testid="section-uploaded-files">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Uploaded artifacts ({portfolioFiles.length})
            </p>
            {portfolioFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-muted-foreground"
                data-testid={`uploaded-file-${i}`}
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{f.name}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AcademyPathwayPage() {
  useEffect(() => { document.title = 'Career Pathway | ThriveUp'; }, []);

  const { data: plan, isLoading: planLoading, error: planError, refetch: refetchPlan } = useQuery<PathwayPlan | null>({
    queryKey: ["/api/pathway-plan"],
    retry: false,
  });

  const { data: careers } = useQuery<CareerField[]>({
    queryKey: ["/api/careers"],
  });

  if (planLoading) {
    return <LoadingSkeleton />;
  }

  if (planError) {
    return <div className="p-6"><ErrorRetry message="Failed to load pathway plan. Please try again." onRetry={refetchPlan} /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" data-testid="academy-pathway-page">
      <PageHeader
        title="Career Pathways"
        breadcrumbs={[
          { label: "Learn", href: "/academy" },
          { label: "My Pathway" },
        ]}
        actions={<TrainingGuideButton moduleId="academy-pathway" />}
      />
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-700 p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-md p-2.5 bg-white/10">
            <Target className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white" data-testid="text-pathway-title">
            My Pathway
          </h1>
        </div>
        <p className="text-rose-100 text-lg" data-testid="text-pathway-subtitle">
          Your Journey from 6th Grade to Your Future
        </p>
      </div>

      {plan ? (
        <PathwayTimeline plan={plan} />
      ) : (
        <CreatePathwayWizard careers={careers ?? []} />
      )}
    </div>
  );
}
