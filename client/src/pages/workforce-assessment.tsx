import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkforceAssessment, InsertWorkforceAssessment } from "@shared/schema";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  Target,
  Star,
  CheckCircle2,
  ArrowRight,
  FileText,
  Users,
  Shield,
  Heart,
  Lightbulb,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";

const WIZARD_STEPS = [
  { key: "skills", label: "Skills Inventory", icon: Star },
  { key: "work", label: "Work History", icon: Briefcase },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "barriers", label: "Barriers", icon: AlertTriangle },
  { key: "interests", label: "Career Interests", icon: Target },
  { key: "readiness", label: "Readiness", icon: CheckCircle2 },
  { key: "plan", label: "Your Plan", icon: Sparkles },
];

const SKILL_OPTIONS = [
  "Communication", "Teamwork", "Problem Solving", "Customer Service",
  "Computer Skills", "Math/Calculations", "Physical Labor", "Driving",
  "Food Service", "Retail/Sales", "Construction", "Mechanical/Repair",
  "Childcare", "Healthcare/Caregiving", "Office/Administrative",
  "Warehouse/Logistics", "Landscaping", "Cleaning/Janitorial",
  "Electrical Work", "Plumbing", "Welding", "Carpentry",
  "Graphic Design", "Social Media", "Data Entry", "Writing",
];

const BARRIER_OPTIONS = [
  { id: "transportation", label: "Transportation", description: "No reliable vehicle or transit access" },
  { id: "childcare", label: "Childcare", description: "Need childcare to attend training or work" },
  { id: "background", label: "Criminal Background", description: "Background check may limit opportunities" },
  { id: "licensing", label: "Licensing Restrictions", description: "Cannot obtain certain licenses" },
  { id: "housing", label: "Housing Instability", description: "Unstable housing situation" },
  { id: "health", label: "Health Issues", description: "Physical or mental health barriers" },
  { id: "substance", label: "Substance Recovery", description: "In recovery from substance use" },
  { id: "education", label: "Education Gap", description: "No diploma or GED" },
  { id: "language", label: "Language Barrier", description: "Limited English proficiency" },
  { id: "technology", label: "Digital Literacy", description: "Limited computer or internet skills" },
  { id: "legal", label: "Legal Issues", description: "Pending legal matters" },
  { id: "identification", label: "ID/Documents", description: "Missing identification documents" },
];

const CAREER_INTEREST_OPTIONS = [
  "Construction & Trades", "Healthcare", "Technology & IT",
  "Manufacturing", "Transportation & Logistics", "Food Service & Hospitality",
  "Retail & Customer Service", "Office & Administration",
  "Education & Childcare", "Automotive", "Landscaping & Agriculture",
  "Cleaning & Maintenance", "Security", "Warehouse & Distribution",
  "Creative & Media", "Finance & Banking",
];

const EDUCATION_LEVELS = [
  "No formal education", "Some high school", "GED", "High school diploma",
  "Some college", "Associate degree", "Bachelor's degree", "Trade/vocational certificate",
  "Master's degree or higher",
];

const READINESS_LEVELS = [
  { value: "exploring", label: "Exploring", description: "Just starting to think about career options" },
  { value: "preparing", label: "Preparing", description: "Building skills and addressing barriers" },
  { value: "ready", label: "Job Ready", description: "Ready to apply and interview for jobs" },
  { value: "placed", label: "Placed", description: "Currently employed, tracking progress" },
];

interface AssessmentInput {
  barriers?: string[];
  careerInterests?: string[];
  readinessLevel?: string;
}

interface PersonalizedPlan {
  recommendations: string[];
  nextSteps: string[];
  programs: string[];
}

function generatePlan(data: AssessmentInput): PersonalizedPlan {
  const plan: PersonalizedPlan = { recommendations: [], nextSteps: [], programs: [] };

  if (data.barriers?.includes("education")) {
    plan.recommendations.push("Enroll in a GED program through your local American Job Center");
    plan.programs.push("GED Preparation");
  }
  if (data.barriers?.includes("background")) {
    plan.recommendations.push("Connect with fair chance employers who have ban-the-box policies");
    plan.recommendations.push("Prepare a background disclosure strategy with your case manager");
    plan.programs.push("Fair Chance Hiring Partners");
  }
  if (data.barriers?.includes("transportation")) {
    plan.recommendations.push("Apply for transit pass assistance through your local workforce board");
  }
  if (data.barriers?.includes("identification")) {
    plan.recommendations.push("Visit your local American Job Center for help obtaining identification documents");
  }

  if (data.careerInterests?.includes("Technology & IT")) {
    plan.programs.push("CompTIA A+ Certification", "Google Career Certificates");
    plan.nextSteps.push("Start with free Google IT Support certificate on Coursera");
  }
  if (data.careerInterests?.includes("Construction & Trades")) {
    plan.programs.push("OSHA 10/30 Safety Training", "Registered Apprenticeship Programs", "YouthBuild");
    plan.nextSteps.push("Get OSHA 10 certification online (1 week, low cost)");
  }
  if (data.careerInterests?.includes("Healthcare")) {
    plan.programs.push("CNA Training", "Community College Healthcare Programs");
    plan.nextSteps.push("Explore CNA certification at your local community college");
  }
  if (data.careerInterests?.includes("Transportation & Logistics")) {
    plan.programs.push("CDL Training Program");
    plan.nextSteps.push("Check WIOA funding eligibility for CDL training");
  }

  plan.nextSteps.push("Visit your local American Job Center for a comprehensive skills assessment");
  plan.nextSteps.push("Update your resume with current skills and experience");

  if (data.readinessLevel === "exploring") {
    plan.nextSteps.unshift("Complete a career interest assessment at your local workforce center");
  } else if (data.readinessLevel === "ready") {
    plan.nextSteps.unshift("Begin applying to barrier-friendly employers in your area");
  }

  return plan;
}

export default function WorkforceAssessmentPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [workHistory, setWorkHistory] = useState<{ title: string; duration: string; description: string }[]>([]);
  const [newJob, setNewJob] = useState({ title: "", duration: "", description: "" });
  const [educationLevel, setEducationLevel] = useState("");
  const [barriers, setBarriers] = useState<string[]>([]);
  const [careerInterests, setCareerInterests] = useState<string[]>([]);
  const [readinessLevel, setReadinessLevel] = useState("exploring");
  const [userName, setUserName] = useState("");
  const [showExisting, setShowExisting] = useState(false);

  const { data: existingAssessments, isLoading } = useQuery<WorkforceAssessment[]>({
    queryKey: ["/api/workforce/assessments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertWorkforceAssessment) => {
      const res = await apiRequest("POST", "/api/workforce/assessments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce/assessments"] });
      toast({ title: "Assessment Complete!", description: "Your workforce development plan has been created." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const assessmentData = { skills, workHistory, educationLevel, barriers, careerInterests, readinessLevel };
    const personalizedPlan = generatePlan(assessmentData);
    createMutation.mutate({
      userName: userName || "Participant",
      skills,
      workHistory,
      educationLevel,
      barriers,
      careerInterests,
      readinessLevel,
      assessmentData,
      personalizedPlan,
      status: "completed",
    });
  };

  const toggleSkill = (skill: string) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills(prev => [...prev, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const toggleBarrier = (barrier: string) => {
    setBarriers(prev => prev.includes(barrier) ? prev.filter(b => b !== barrier) : [...prev, barrier]);
  };

  const toggleInterest = (interest: string) => {
    setCareerInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const addWorkEntry = () => {
    if (newJob.title.trim()) {
      setWorkHistory(prev => [...prev, { ...newJob }]);
      setNewJob({ title: "", duration: "", description: "" });
    }
  };

  const removeWorkEntry = (idx: number) => {
    setWorkHistory(prev => prev.filter((_, i) => i !== idx));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return userName.trim().length > 0;
      case 1: return skills.length > 0;
      case 2: return true;
      case 3: return educationLevel.length > 0;
      case 4: return true;
      case 5: return careerInterests.length > 0;
      case 6: return true;
      default: return true;
    }
  };

  const progressValue = ((step) / (WIZARD_STEPS.length)) * 100;

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const latestAssessment = existingAssessments?.[0];
  const hasCompleted = latestAssessment?.status === "completed";

  if (hasCompleted && !showExisting && step === 0) {
    const plan = latestAssessment.personalizedPlan || {};
    return (
      <div className="p-6 max-w-4xl mx-auto" data-testid="section-assessment-results">
        <PageHeader
          title="Workforce Assessment"
          description="Your personalized workforce development plan"
          icon={<ClipboardCheck className="h-7 w-7" />}
        />

        <Card className="p-6 mb-6 border-emerald-200 dark:border-emerald-800/50" data-testid="card-completed-assessment">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-md bg-gradient-to-br from-emerald-500 to-green-600">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg" data-testid="text-assessment-status">Assessment Complete</h2>
              <p className="text-sm text-muted-foreground">
                Completed {new Date(latestAssessment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4" data-testid="card-readiness-level">
              <p className="text-xs text-muted-foreground mb-1">Readiness Level</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {latestAssessment.readinessLevel}
              </Badge>
            </Card>
            <Card className="p-4" data-testid="card-skills-count">
              <p className="text-xs text-muted-foreground mb-1">Skills Identified</p>
              <p className="font-semibold text-lg">{Array.isArray(latestAssessment.skills) ? latestAssessment.skills.length : 0}</p>
            </Card>
            <Card className="p-4" data-testid="card-barriers-count">
              <p className="text-xs text-muted-foreground mb-1">Barriers Identified</p>
              <p className="font-semibold text-lg">{Array.isArray(latestAssessment.barriers) ? latestAssessment.barriers.length : 0}</p>
            </Card>
          </div>

          {plan.recommendations?.length > 0 && (
            <div className="mb-4" data-testid="section-recommendations">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Recommendations
              </h3>
              <ul className="space-y-2">
                {plan.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2" data-testid={`text-recommendation-${i}`}>
                    <ArrowRight className="h-3 w-3 mt-1 text-muted-foreground shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.programs?.length > 0 && (
            <div className="mb-4" data-testid="section-suggested-programs">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-500" /> Suggested Programs
              </h3>
              <div className="flex flex-wrap gap-2">
                {plan.programs.map((prog: string, i: number) => (
                  <Badge key={i} variant="secondary" data-testid={`badge-program-${i}`}>{prog}</Badge>
                ))}
              </div>
            </div>
          )}

          {plan.nextSteps?.length > 0 && (
            <div className="mb-6" data-testid="section-next-steps">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-rose-500" /> Next Steps
              </h3>
              <ol className="space-y-2 list-decimal list-inside">
                {plan.nextSteps.map((step: string, i: number) => (
                  <li key={i} className="text-sm" data-testid={`text-next-step-${i}`}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" onClick={() => { setStep(0); setShowExisting(true); }} data-testid="button-retake-assessment">
              <RefreshCw className="h-4 w-4 mr-2" /> Retake Assessment
            </Button>
            <Link href="/workforce-training">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none" data-testid="button-view-training">
                <GraduationCap className="h-4 w-4 mr-2" /> Browse Training Programs
              </Button>
            </Link>
            <Link href="/workforce-employers">
              <Button variant="outline" data-testid="button-view-employers">
                <Briefcase className="h-4 w-4 mr-2" /> View Employer Partners
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const currentStep = WIZARD_STEPS[step] || WIZARD_STEPS[0];
  const StepIcon = step === 0 ? FileText : currentStep?.icon || FileText;

  return (
    <div className="p-6 max-w-4xl mx-auto" data-testid="section-workforce-assessment">
      <PageHeader
        title="Workforce Assessment"
        description="Evaluate your skills, identify barriers, and create a personalized workforce development plan"
        icon={<ClipboardCheck className="h-7 w-7" />}
      />

      <Card className="p-6 mb-6" data-testid="card-assessment-wizard">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-gradient-to-br from-rose-500 to-red-600 shrink-0">
            <StepIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" data-testid="text-step-label">
              {step === 0 ? "Getting Started" : `Step ${step} of ${WIZARD_STEPS.length}: ${currentStep.label}`}
            </p>
            <Progress value={progressValue} className="h-2 mt-1" data-testid="progress-assessment" />
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-4" data-testid="section-step-intro">
            <h3 className="font-semibold text-lg">Welcome to Your Workforce Assessment</h3>
            <p className="text-sm text-muted-foreground">
              This assessment will help us understand your skills, experience, and any barriers to employment.
              We'll create a personalized plan to help you succeed in the workforce.
            </p>
            <div>
              <label className="text-sm font-medium block mb-1">Your Name</label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                data-testid="input-user-name"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4" data-testid="section-step-skills">
            <h3 className="font-semibold text-lg">Skills Inventory</h3>
            <p className="text-sm text-muted-foreground">Select all skills you have. These don't need to be from formal training — life experience counts!</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(skill => (
                <Badge
                  key={skill}
                  variant={skills.includes(skill) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${skills.includes(skill) ? "bg-blue-600 text-white" : "hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                  onClick={() => toggleSkill(skill)}
                  data-testid={`badge-skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                >
                  {skill}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="Add a custom skill..."
                onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
                data-testid="input-custom-skill"
              />
              <Button variant="outline" size="sm" onClick={addCustomSkill} data-testid="button-add-skill">Add</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4" data-testid="section-step-work">
            <h3 className="font-semibold text-lg">Work History</h3>
            <p className="text-sm text-muted-foreground">List any work experience, including informal, volunteer, or gig work. Skip if none.</p>
            {workHistory.map((job, idx) => (
              <Card key={idx} className="p-3 flex items-start justify-between gap-2" data-testid={`card-work-entry-${idx}`}>
                <div>
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.duration}</p>
                  {job.description && <p className="text-xs mt-1">{job.description}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeWorkEntry(idx)} data-testid={`button-remove-work-${idx}`}>×</Button>
              </Card>
            ))}
            <div className="space-y-2 border rounded-md p-3">
              <Input value={newJob.title} onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))} placeholder="Job title or role" data-testid="input-job-title" />
              <Input value={newJob.duration} onChange={(e) => setNewJob(prev => ({ ...prev, duration: e.target.value }))} placeholder="Duration (e.g., 6 months, 2 years)" data-testid="input-job-duration" />
              <Textarea value={newJob.description} onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief description (optional)" rows={2} data-testid="input-job-description" />
              <Button variant="outline" size="sm" onClick={addWorkEntry} disabled={!newJob.title.trim()} data-testid="button-add-work">Add Experience</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4" data-testid="section-step-education">
            <h3 className="font-semibold text-lg">Education Level</h3>
            <p className="text-sm text-muted-foreground">Select your highest level of education completed.</p>
            <Select value={educationLevel} onValueChange={setEducationLevel}>
              <SelectTrigger data-testid="select-education-level">
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_LEVELS.map(level => (
                  <SelectItem key={level} value={level} data-testid={`option-education-${level.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4" data-testid="section-step-barriers">
            <h3 className="font-semibold text-lg">Barriers to Employment</h3>
            <p className="text-sm text-muted-foreground">
              Identifying barriers helps us connect you with the right resources. This information is confidential and used only to support your success.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BARRIER_OPTIONS.map(barrier => (
                <Card
                  key={barrier.id}
                  className={`p-3 cursor-pointer transition-all ${barriers.includes(barrier.id) ? "ring-2 ring-amber-400 dark:ring-amber-600 bg-amber-50 dark:bg-amber-900/20" : "hover:bg-muted/50"}`}
                  onClick={() => toggleBarrier(barrier.id)}
                  data-testid={`card-barrier-${barrier.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${barriers.includes(barrier.id) ? "bg-amber-500 border-amber-500 text-white" : "border-muted-foreground/30"}`}>
                      {barriers.includes(barrier.id) && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{barrier.label}</p>
                      <p className="text-xs text-muted-foreground">{barrier.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4" data-testid="section-step-interests">
            <h3 className="font-semibold text-lg">Career Interests</h3>
            <p className="text-sm text-muted-foreground">Select the career fields that interest you most.</p>
            <div className="flex flex-wrap gap-2">
              {CAREER_INTEREST_OPTIONS.map(interest => (
                <Badge
                  key={interest}
                  variant={careerInterests.includes(interest) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${careerInterests.includes(interest) ? "bg-emerald-600 text-white" : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}`}
                  onClick={() => toggleInterest(interest)}
                  data-testid={`badge-interest-${interest.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4" data-testid="section-step-readiness">
            <h3 className="font-semibold text-lg">Readiness Level</h3>
            <p className="text-sm text-muted-foreground">How would you describe your current job readiness?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {READINESS_LEVELS.map(level => (
                <Card
                  key={level.value}
                  className={`p-4 cursor-pointer transition-all ${readinessLevel === level.value ? "ring-2 ring-blue-400 dark:ring-blue-600 bg-blue-50 dark:bg-blue-900/20" : "hover:bg-muted/50"}`}
                  onClick={() => setReadinessLevel(level.value)}
                  data-testid={`card-readiness-${level.value}`}
                >
                  <p className="text-sm font-medium">{level.label}</p>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setStep(prev => Math.max(0, prev - 1))}
            disabled={step === 0}
            data-testid="button-prev-step"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          {step < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(prev => prev + 1)}
              disabled={!canProceed()}
              data-testid="button-next-step"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-none"
              data-testid="button-submit-assessment"
            >
              {createMutation.isPending ? "Creating Plan..." : "Generate My Workforce Plan"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
